function guessCompany() {
  const host = location.hostname.replace(/^www\./, '');
  const parts = host.split('.');
  if (parts.length >= 2) return parts[parts.length - 2];
  return host;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'scrape') {
    const title =
      document.querySelector('h1')?.innerText?.trim() ||
      document.querySelector('[data-automation-id="jobPostingHeader"]')?.innerText?.trim() ||
      document.title;
    const company =
      document.querySelector('[data-company]')?.getAttribute('data-company') ||
      document.querySelector('.company, .employer, [class*="company"]')?.innerText?.trim() ||
      guessCompany();
    sendResponse({ url: location.href, title, company });
  }
  return true;
});
