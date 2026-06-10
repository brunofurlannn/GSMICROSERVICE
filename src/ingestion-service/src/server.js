const express = require('express');
const morgan = require('morgan');
const { fetchGstEvents, normalizeGstEvents } = require('./nasaClient');
const { publishEvents } = require('./rabbitPublisher');

const app = express();
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;
const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const NASA_BASE_URL = process.env.NASA_BASE_URL || 'https://api.nasa.gov';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = process.env.QUEUE_NAME || 'space.weather.events';

app.get('/health', (req, res) => res.json({ service: 'ingestion-service', status: 'up' }));

app.post('/api/ingest/gst', async (req, res) => {
  try {
    const nasaEvents = await fetchGstEvents({ apiKey: NASA_API_KEY, baseUrl: NASA_BASE_URL, retries: 3 });
    const events = normalizeGstEvents(nasaEvents);
    await publishEvents({ rabbitUrl: RABBITMQ_URL, queueName: QUEUE_NAME, events });
    return res.status(202).json({ message: 'Ingestao concluida e eventos publicados no RabbitMQ.', count: events.length });
  } catch (error) {
    console.error('[Ingestion] Erro:', error.message);
    return res.status(500).json({ message: 'Erro ao ingerir dados da NASA DONKI.', error: error.message });
  }
});

app.listen(PORT, () => console.log(`Ingestion Service rodando na porta ${PORT}`));
