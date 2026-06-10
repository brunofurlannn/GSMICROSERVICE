const express = require('express');
const morgan = require('morgan');
const amqp = require('amqplib');
const Redis = require('ioredis');
const { classifyKpRisk } = require('./riskClassifier');
const { processWithIdempotency } = require('./idempotency');

const app = express();
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3001;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = process.env.QUEUE_NAME || 'space.weather.events';
const ALERTS_CACHE_TTL_SECONDS = Number(process.env.ALERTS_CACHE_TTL_SECONDS || 60);
const redis = new Redis(REDIS_URL);

async function saveAlert(event) {
  const risk = classifyKpRisk(event.kp);
  const alert = {
    event_id: event.event_id,
    type: event.type,
    source: event.source,
    startTime: event.startTime,
    kp: event.kp,
    severity: risk.severity,
    emergencyNotification: risk.emergencyNotification,
    createdAt: new Date().toISOString(),
  };
  await redis.lpush('alerts', JSON.stringify(alert));
  await redis.del('cache:alerts');
  console.log(`[Alert] Alerta salvo: ${alert.event_id} - ${alert.severity}`);
}

async function startConsumer() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  channel.consume(QUEUE_NAME, async (message) => {
    if (!message) return;
    try {
      const event = JSON.parse(message.content.toString());
      await processWithIdempotency({ redis, event, onNewEvent: saveAlert });
      channel.ack(message);
    } catch (error) {
      console.error('[Consumer] Erro ao processar mensagem:', error.message);
      channel.nack(message, false, false);
    }
  });
  console.log(`[RabbitMQ] Consumer conectado na fila ${QUEUE_NAME}`);
}

app.get('/health', (req, res) => res.json({ service: 'alert-service', status: 'up' }));

app.get('/api/alerts', async (req, res) => {
  const cached = await redis.get('cache:alerts');
  if (cached) {
    res.set('X-Cache', 'HIT');
    return res.json(JSON.parse(cached));
  }

  const values = await redis.lrange('alerts', 0, 49);
  const alerts = values.map((value) => JSON.parse(value));
  const payload = { cache: 'MISS', ttlSeconds: ALERTS_CACHE_TTL_SECONDS, alerts };
  await redis.set('cache:alerts', JSON.stringify(payload), 'EX', ALERTS_CACHE_TTL_SECONDS);
  res.set('X-Cache', 'MISS');
  return res.json(payload);
});

app.listen(PORT, () => console.log(`Alert Service rodando na porta ${PORT}`));
startConsumer().catch((error) => console.error('[RabbitMQ] Falha ao iniciar consumer:', error.message));
