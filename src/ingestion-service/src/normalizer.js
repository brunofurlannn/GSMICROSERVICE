function normalizeGstEvents(events) {
  return (events || []).map((event, index) => {
    const kpObject = event.allKpIndex?.[0] || {};
    const kp = Number(kpObject.kpIndex || 0);
    return {
      event_id: event.gstID || `GST-${index}-${event.startTime}`,
      type: 'GST',
      source: 'NASA DONKI',
      startTime: event.startTime,
      kp,
      link: event.link,
      raw: event,
    };
  });
}
module.exports = { normalizeGstEvents };
