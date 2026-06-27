// Runs on remotelymatch site only — receives credentials from Profile and saves to extension storage.
const ALLOWED = [
  'https://remotelymatch.app',
  'https://www.remotelymatch.app',
  'https://remotematch.onrender.com',
  'https://remotematch.app',
  'https://www.remotematch.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

if (ALLOWED.includes(window.location.origin)) {
  window.addEventListener('message', (event) => {
    const configTypes = ['REMOTELYMATCH_EXT_CONFIG', 'REMOTEMATCH_EXT_CONFIG'];
    if (event.source !== window || !configTypes.includes(event.data?.type)) return;
    const { apiBase, accessToken } = event.data;
    if (!apiBase || !accessToken) return;
    chrome.storage.sync.set({ apiBase, accessToken }, () => {
      window.postMessage({ type: 'REMOTELYMATCH_EXT_CONFIGURED', ok: true }, window.location.origin);
    });
  });
}
