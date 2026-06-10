const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeGstEvents } = require('../src/normalizer');

test('normaliza eventos GST da NASA com event_id e kp', () => {
  const result = normalizeGstEvents([{ gstID: 'GST-001', startTime: '2026-01-01T00:00Z', allKpIndex: [{ kpIndex: 8 }] }]);
  assert.equal(result[0].event_id, 'GST-001');
  assert.equal(result[0].kp, 8);
});
