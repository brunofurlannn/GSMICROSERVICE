function classifyKpRisk(kp) {
  const value = Number(kp);
  if (value <= 4) return { severity: 'low', emergencyNotification: false };
  if (value >= 5 && value <= 7) return { severity: 'moderate', emergencyNotification: false };
  return { severity: 'severe', emergencyNotification: true };
}

module.exports = { classifyKpRisk };
