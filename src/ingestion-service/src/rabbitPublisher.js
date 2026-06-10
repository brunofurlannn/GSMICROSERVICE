const amqp = require('amqplib');

async function publishEvents({ rabbitUrl, queueName, events }) {
  const connection = await amqp.connect(rabbitUrl);
  const channel = await connection.createChannel();
  await channel.assertQueue(queueName, { durable: true });

  for (const event of events) {
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(event)), {
      persistent: true,
      contentType: 'application/json',
    });
    console.log(`[RabbitMQ] Evento publicado: ${event.event_id}`);
  }

  await channel.close();
  await connection.close();
}

module.exports = { publishEvents };
