async function wasAlreadyProcessed(redis, eventId) {
  return Boolean(await redis.get(`processed:${eventId}`));
}

async function markAsProcessed(redis, eventId) {
  await redis.set(`processed:${eventId}`, 'true');
}

async function processWithIdempotency({ redis, event, onNewEvent }) {
  if (await wasAlreadyProcessed(redis, event.event_id)) {
    console.log(`[Idempotencia] Evento duplicado descartado: ${event.event_id}`);
    return { duplicated: true };
  }
  await markAsProcessed(redis, event.event_id);
  await onNewEvent(event);
  return { duplicated: false };
}

module.exports = { wasAlreadyProcessed, markAsProcessed, processWithIdempotency };
