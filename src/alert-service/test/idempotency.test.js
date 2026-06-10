const test = require('node:test');
const assert = require('node:assert/strict');
const { processWithIdempotency } = require('../src/idempotency');

class FakeRedis {
  constructor() { this.store = new Map(); }
  async get(key) { return this.store.get(key); }
  async set(key, value) { this.store.set(key, value); }
}

test('RN3: evento duplicado deve ser descartado por event_id', async () => {
  const redis = new FakeRedis();
  let processed = 0;
  const event = { event_id: 'GST-DUP-001' };
  const onNewEvent = async () => { processed += 1; };

  const first = await processWithIdempotency({ redis, event, onNewEvent });
  const second = await processWithIdempotency({ redis, event, onNewEvent });

  assert.equal(first.duplicated, false);
  assert.equal(second.duplicated, true);
  assert.equal(processed, 1);
});
