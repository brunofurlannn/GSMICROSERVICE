const axios = require('axios');
const { normalizeGstEvents } = require('./normalizer');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

async function fetchGstEvents({ apiKey, baseUrl, retries = 3 }) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);

  const url = `${baseUrl}/DONKI/GST`;
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await axios.get(url, {
        params: {
          startDate: formatDate(start),
          endDate: formatDate(end),
          api_key: apiKey,
        },
        timeout: 8000,
      });
      return response.data;
    } catch (error) {
      lastError = error;
      console.log(`[NASA] Falha tentativa ${attempt}/${retries}. Aplicando backoff.`);
      await sleep(500 * attempt);
    }
  }

  throw lastError;
}



module.exports = { fetchGstEvents, normalizeGstEvents };
