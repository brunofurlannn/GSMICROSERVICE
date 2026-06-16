function classifyKpRisk(kp) {
  const value = Number(kp);
  if (value <= 3) return { severity: 'baixa', emergencyNotification: false };
  if (value >= 4 && value <= 7) return { severity: 'moderada', emergencyNotification: false };
  return { severity: 'alta', emergencyNotification: true };
}

module.exports = { classifyKpRisk };
