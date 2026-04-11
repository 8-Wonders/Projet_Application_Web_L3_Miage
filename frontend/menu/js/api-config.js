// Set APP_CONFIG.API_BASE_URL to your deployed backend URL when frontend is hosted separately (e.g. GitHub Pages).
window.APP_CONFIG = window.APP_CONFIG || {};
window.APP_CONFIG.API_BASE_URL = window.APP_CONFIG.API_BASE_URL || 'https://projet-application-web-l3-miage.onrender.com';
window.APP_CONFIG.GOOGLE_CLIENT_ID = window.APP_CONFIG.GOOGLE_CLIENT_ID || '';

function normalizeApiBaseUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/+$/, '');
}

const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const isGithubPagesHost = window.location.hostname.endsWith('github.io');
const params = new URLSearchParams(window.location.search);

// Quick production override without code changes:
// https://<site>/?apiBaseUrl=https://your-backend.example.com
const queryApiBaseUrl = normalizeApiBaseUrl(params.get('apiBaseUrl'));
if (queryApiBaseUrl) {
  localStorage.setItem('apiBaseUrl', queryApiBaseUrl);
}

const storageApiBaseUrl = normalizeApiBaseUrl(localStorage.getItem('apiBaseUrl'));
const configuredBaseUrl = normalizeApiBaseUrl(window.APP_CONFIG.API_BASE_URL);

const resolvedApiBaseUrl = queryApiBaseUrl || storageApiBaseUrl || (isLocalHost ? '' : configuredBaseUrl);

// Local dev: keep same-origin relative routes. Remote frontend: use configured absolute backend URL.
window.API_BASE_URL = resolvedApiBaseUrl || (isLocalHost ? '' : '');

if (isGithubPagesHost && !window.API_BASE_URL) {
  console.error('[API CONFIG] Missing API base URL on GitHub Pages. Configure APP_CONFIG.API_BASE_URL or open with ?apiBaseUrl=https://your-backend');
}