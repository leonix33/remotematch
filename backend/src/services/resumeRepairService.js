/**
 * Fix broken line breaks in pasted/extracted resumes before section parsing.
 */

const FALSE_MID_SENTENCE_HEADERS = new Set(['EXPERIENCE', 'CERTIFICATION', 'SKILLS', 'TOOLS', 'EDUCATION']);

function endsIncomplete(line) {
  const t = String(line || '').trim();
  if (!t) return false;
  if (/[.!?]$/.test(t)) return false;
  return /\b(of|and|with|for|in|to|the|a|an|Extensive|including)$/i.test(t) || t.length < 120;
}

function startsContinuation(line) {
  return /^[a-z(]/.test(String(line || '').trim());
}

function repairFalseSectionBreaks(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const t = raw.trim();
    const prev = out.length ? out[out.length - 1].trim() : '';
    const next = (lines[i + 1] || '').trim();
    const upper = t.toUpperCase();

    if (FALSE_MID_SENTENCE_HEADERS.has(upper) && t.length < 40) {
      if (upper === 'EXPERIENCE' && /\bof$/i.test(prev) && startsContinuation(next)) {
        out[out.length - 1] = `${prev} ${next}`;
        i += 1;
        continue;
      }
      if (upper === 'CERTIFICATION' && /\bExtensive$/i.test(prev) && /^portfolio/i.test(next)) {
        out[out.length - 1] = `${prev} certification ${next}`;
        i += 1;
        continue;
      }
      if (endsIncomplete(prev) && startsContinuation(next)) {
        out[out.length - 1] = `${prev} ${next}`;
        i += 1;
        continue;
      }
    }

    out.push(raw);
  }
  return out;
}

function repairSplitNameLines(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const t = (lines[i] || '').trim();
    const next = (lines[i + 1] || '').trim();

    if (/^[A-Z]{2,20}$/.test(t) && /^[A-Z][A-Za-z'-]+\s+/.test(next)) {
      const parts = next.split(/\s+/);
      const surname = parts[0];
      const rest = parts.slice(1).join(' ');
      out.push(`${t} ${surname}`);
      if (rest) out.push(rest);
      i += 1;
      continue;
    }

    if (/^[A-Z]{2,20}$/.test(t) && /^[A-Z]{2,20}$/.test(next)) {
      out.push(`${t} ${next}`);
      i += 1;
      continue;
    }

    out.push(lines[i]);
  }
  return out;
}

function repairResumeLines(lines) {
  let fixed = [...lines];
  fixed = repairSplitNameLines(fixed);
  fixed = repairFalseSectionBreaks(fixed);
  return fixed;
}

function repairResumeText(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  return repairResumeLines(lines).join('\n');
}

module.exports = { repairResumeText, repairResumeLines };
