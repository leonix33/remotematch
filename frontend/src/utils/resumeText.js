/** Detect raw file bytes saved as text (e.g. broken .docx upload). */
export function isUnreadableResumeText(text = '') {
  const trimmed = String(text).trim();
  if (trimmed.length < 20) return true;

  const head = trimmed.slice(0, 1000);
  if (
    head.includes('[Content_Types].xml') ||
    head.includes('word/_rels/document.xml.rels') ||
    head.startsWith('PK')
  ) {
    return true;
  }

  let controlChars = 0;
  const sampleLen = Math.min(head.length, 500);
  for (let i = 0; i < sampleLen; i += 1) {
    const code = head.charCodeAt(i);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) controlChars += 1;
  }
  if (controlChars > 10) return true;

  const letters = (head.match(/[A-Za-z]/g) || []).length;
  return letters < sampleLen * 0.12;
}

export function formatResumeUploadError(error) {
  const status = error?.response?.status;
  const message = error?.response?.data?.message;
  if (message) return message;
  if (status === 502 || status === 503 || status === 504) {
    return 'Server is waking up or busy. Wait a moment and try again, or paste your resume text below.';
  }
  if (status === 413) return 'File is too large. Use a smaller PDF or paste text instead.';
  return error?.message || 'Could not parse resume';
}
