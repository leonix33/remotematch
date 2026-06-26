/** Detect raw file bytes saved as text (e.g. broken .docx upload). */
export function isUnreadableResumeText(text = '') {
  const trimmed = String(text).trim();
  if (trimmed.length < 20) return true;

  const sample = trimmed.slice(0, 4000);

  if (
    /\[Content_Types\]|word\/document\.xml|word\/_rels|word\/fontTable\.xml|word\/webSettings\.xml|_rels\/\.rels|theme\/theme/i.test(
      sample
    )
  ) {
    return true;
  }

  if (sample.startsWith('PK') || (sample.includes('PK') && sample.includes('.xml'))) {
    return true;
  }

  let controlChars = 0;
  let replacementChars = 0;
  const sampleLen = Math.min(sample.length, 800);
  for (let i = 0; i < sampleLen; i += 1) {
    const code = sample.charCodeAt(i);
    if (code === 0xfffd) replacementChars += 1;
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) controlChars += 1;
  }
  if (controlChars > 8 || replacementChars > 4) return true;

  const letters = (sample.match(/[A-Za-z]/g) || []).length;
  if (letters < sampleLen * 0.1) return true;

  const words = sample.split(/\s+/).filter((w) => /[A-Za-z]{2,}/.test(w));
  if (sample.length > 300 && words.length < 8) return true;

  return false;
}

export function sanitizeResumeProfile(profile) {
  if (!profile) return profile;
  if (!isUnreadableResumeText(profile.resumeText || '')) return profile;
  return {
    ...profile,
    resumeText: '',
    resumeFileName: '',
    extractedSkills: [],
    resumeScore: 0,
    resumeUnreadable: true,
  };
}

export async function isZipDocxFile(file) {
  const buf = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buf);
  return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
