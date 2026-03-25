// Set APP_CONFIG.API_BASE_URL to your deployed backend URL when frontend is hosted separately (e.g. GitHub Pages).
window.APP_CONFIG = window.APP_CONFIG || {};

function normalizeApiBaseUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/+$/, '');
}

const configuredBaseUrl = normalizeApiBaseUrl(window.APP_CONFIG.API_BASE_URL);
const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

// Local dev: keep same-origin relative routes. Remote frontend: use configured absolute backend URL.
window.API_BASE_URL = configuredBaseUrl || (isLocalHost ? '' : '');