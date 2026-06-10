const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyKpRisk } = require('../src/riskClassifier');

test('RN1: Kp <= 4 deve ser low', () => {
  assert.deepEqual(classifyKpRisk(4), { severity: 'low', emergencyNotification: false });
});

test('RN1: 5 <= Kp <= 7 deve ser moderate', () => {
  assert.deepEqual(classifyKpRisk(6), { severity: 'moderate', emergencyNotification: false });
});

test('RN1: Kp >= 8 deve ser severe e ativar emergencyNotification', () => {
  assert.deepEqual(classifyKpRisk(8), { severity: 'severe', emergencyNotification: true });
});
