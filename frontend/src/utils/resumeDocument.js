const IMMUTABLE_SECTION_KEYS = new Set([
  'education',
  'certifications',
  'credentials',
  'licenses',
  'training',
  'clearances',
]);

const SECTION_DEFS = [
  { key: 'summary', labels: /^(professional\s+)?summary$|^profile$|^objective$|^about(\s+me)?$/i },
  {
    key: 'experience',
    labels:
      /^(work\s+)?experience$|^employment(\s+history)?$|^professional\s+experience$|^career(\s+history)?$|^relevant\s+experience$/i,
  },
  { key: 'education', labels: /^education$|^academic(\s+background)?$|^degrees?$/i },
  {
    key: 'certifications',
    labels: /^certifications?$|^credentials$|^licenses?$|^licences?$|^professional\s+development$|^training$/i,
  },
  { key: 'skills', labels: /^(technical\s+)?skills$|^core\s+competencies$|^technologies$|^tools$/i },
  { key: 'projects', labels: /^projects$|^selected\s+projects$|^key\s+projects$/i },
  { key: 'awards', labels: /^awards$|^honors$|^achievements$/i },
];

function classifySectionHeading(line) {
  const t = line.trim();
  for (const def of SECTION_DEFS) {
    if (def.labels.test(t)) return def.key;
  }
  return 'other';
}

function isLikelySectionHeader(line) {
  const t = line.trim();
  if (!t || t.length > 90) return false;
  if (/^[-•*●▪]\s/.test(t)) return false;
  if (/^\d+[\).]\s/.test(t)) return false;
  if (t.includes('@') || /\(\d{3}\)/.test(t)) return false;
  if (/\b(19|20)\d{2}\b/.test(t) && (t.includes('–') || t.includes('-') || t.includes('to'))) return false;

  const key = classifySectionHeading(t);
  if (key !== 'other') return true;

  if (/^[A-Z][A-Z0-9\s/&\-:()'.]{2,}$/.test(t) && /[A-Z]{2,}/.test(t)) {
    return /\b(EXPERIENCE|EDUCATION|SKILLS|SUMMARY|CERT|PROJECT|EMPLOY|PROFILE|OBJECTIVE|TRAINING|LICENSE|WORK|TECHNICAL|COMPETENC|VOLUNTEER|AWARD)/i.test(
      t
    );
  }

  return false;
}

export function parseResumeForDisplay(resumeText = '') {
  const lines = String(resumeText).replace(/\r\n/g, '\n').split('\n');
  const sections = [];
  let headerLines = [];
  let current = null;
  let seenSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!seenSection && isLikelySectionHeader(trimmed)) {
      seenSection = true;
      const key = classifySectionHeading(trimmed);
      current = { key, heading: trimmed, contentLines: [], immutable: IMMUTABLE_SECTION_KEYS.has(key) };
      sections.push(current);
      continue;
    }

    if (seenSection && isLikelySectionHeader(trimmed)) {
      const key = classifySectionHeading(trimmed);
      current = { key, heading: trimmed, contentLines: [], immutable: IMMUTABLE_SECTION_KEYS.has(key) };
      sections.push(current);
      continue;
    }

    if (!seenSection) {
      if (trimmed || headerLines.length) headerLines.push(line);
      continue;
    }

    if (current) current.contentLines.push(line);
  }

  if (!sections.length && resumeText.trim()) {
    sections.push({ key: 'body', heading: '', contentLines: lines, immutable: false });
    headerLines = [];
  }

  const headingStyle = sections.find((s) => s.heading)?.heading
    ? /^[A-Z][A-Z0-9\s/&\-:()'.]+$/.test(sections.find((s) => s.heading).heading.trim())
      ? 'ALL_CAPS'
      : 'TITLE_CASE'
    : 'PLAIN';

  return {
    headerLines: headerLines.map((l) => l.trimEnd()),
    sections: sections.map((s) => ({
      ...s,
      content: s.contentLines.join('\n').trim(),
      lines: s.contentLines.map((l) => classifyContentLine(l)),
    })),
    headingStyle,
  };
}

export function parseResumeHeader(headerLines = []) {
  const lines = headerLines.map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { name: '', contact: [], headline: '' };

  let name = lines[0];
  let headline = '';
  const contact = [];

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (
      line.includes('@') ||
      line.includes('|') ||
      /https?:\/\//i.test(line) ||
      /\(\d{3}\)/.test(line) ||
      /\d{3}[-.\s]\d{3}[-.\s]\d{4}/.test(line)
    ) {
      contact.push(line);
    } else if (!headline && line.length < 100) {
      headline = line;
    } else {
      contact.push(line);
    }
  }

  return { name, headline, contact };
}

export function classifyContentLine(line) {
  const raw = String(line);
  const t = raw.trim();
  if (!t) return { type: 'spacer' };

  if (/^[-•*●▪◦]\s/.test(t)) {
    return { type: 'bullet', text: t.replace(/^[-•*●▪◦]\s+/, ''), indent: raw.match(/^\s*/)?.[0]?.length || 0 };
  }

  if (/^\d+[\).]\s/.test(t)) {
    return { type: 'bullet', text: t.replace(/^\d+[\).]\s+/, ''), ordered: true };
  }

  if (
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b/i.test(t) ||
    /\b(19|20)\d{2}\s*[–\-—]\s*(Present|Current|\d{4})/i.test(t)
  ) {
    if (t.length < 80) return { type: 'date', text: t };
  }

  if ((/\|/.test(t) || /\s—\s/.test(t) || / - [A-Z]/.test(t)) && t.length < 140 && !/^[-•]/.test(t)) {
    return { type: 'job-header', text: t };
  }

  return { type: 'text', text: t };
}

export function splitContactParts(line) {
  return String(line)
    .split(/\s*[|•·]\s*|\s{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
