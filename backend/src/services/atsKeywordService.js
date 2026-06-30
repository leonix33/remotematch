const { TECH_KEYWORDS } = require('./resumeTailorService');

function normalize(text = '') {
  return String(text).toLowerCase();
}

function tokenize(text = '') {
  return normalize(text)
    .replace(/[^a-z0-9+#./\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function extractJdTerms(jobDescription = '') {
  const blob = normalize(jobDescription);
  const terms = new Set();

  for (const keyword of TECH_KEYWORDS) {
    if (blob.includes(keyword)) terms.add(keyword);
  }

  const lines = String(jobDescription || '')
    .split(/[\n•·\-;]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 8 && l.length < 120);

  for (const line of lines.slice(0, 30)) {
    const words = tokenize(line).filter((w) => w.length >= 4);
    for (const w of words.slice(0, 8)) {
      if (!/^(with|that|this|from|have|will|your|their|about|years|experience)$/.test(w)) {
        terms.add(w);
      }
    }
    const phraseMatch = line.match(
      /\b(kubernetes|terraform|aws|azure|gcp|docker|python|golang|devops|sre|ci\/cd|linux|ansible|jenkins|datadog|kafka|postgres|mongodb)\b/gi
    );
    if (phraseMatch) phraseMatch.forEach((p) => terms.add(normalize(p)));
  }

  return [...terms].slice(0, 40);
}

function termInResume(term, resumeBlob, resumeTokens) {
  const t = normalize(term);
  if (!t) return 'red';
  if (resumeBlob.includes(t)) return 'green';
  const parts = t.split(/[\s/]+/).filter((p) => p.length >= 4);
  if (parts.some((p) => resumeBlob.includes(p))) return 'green';
  if (parts.some((p) => resumeTokens.some((rt) => rt.includes(p) || p.includes(rt)))) return 'yellow';
  if (t.length >= 5 && resumeTokens.some((rt) => rt.startsWith(t.slice(0, 4)))) return 'yellow';
  return 'red';
}

function scoreAtsKeywords({ resumeText = '', tailoredText = '', jobDescription = '' } = {}) {
  const resume = String(tailoredText || resumeText || '').trim();
  const resumeBlob = normalize(resume);
  const resumeTokens = tokenize(resume);
  const terms = extractJdTerms(jobDescription);

  const breakdown = terms.map((term) => ({
    term,
    status: termInResume(term, resumeBlob, resumeTokens),
  }));

  const green = breakdown.filter((b) => b.status === 'green').length;
  const yellow = breakdown.filter((b) => b.status === 'yellow').length;
  const red = breakdown.filter((b) => b.status === 'red').length;
  const termCount = breakdown.length || 1;
  const score = Math.min(100, Math.round(((green + yellow * 0.45) / termCount) * 100));

  return {
    score,
    targetScore: 95,
    green,
    yellow,
    red,
    termCount,
    breakdown,
    readyToSubmit: score >= 85 && red <= Math.max(2, Math.floor(termCount * 0.15)),
  };
}

module.exports = { scoreAtsKeywords, extractJdTerms };
