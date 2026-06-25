const BANNED_PHRASES = [
  [/\bI am excited to\b/gi, "I want to"],
  [/\bI'm excited to\b/gi, "I want to"],
  [/\bI am passionate about\b/gi, "I work on"],
  [/\bI'm passionate about\b/gi, "I work on"],
  [/\bthrilled to\b/gi, "glad to"],
  [/\bleverage\b/gi, 'use'],
  [/\butilize\b/gi, 'use'],
  [/\bcutting-edge\b/gi, 'current'],
  [/\brobust\b/gi, 'solid'],
  [/\bsynergy\b/gi, 'alignment'],
  [/\bdelve\b/gi, 'look'],
  [/\bproven track record\b/gi, 'experience'],
  [/\bdynamic team player\b/gi, 'collaborator'],
  [/\bresults-driven\b/gi, 'hands-on'],
  [/\bin today's fast-paced\b/gi, 'In production'],
  [/\bat the forefront of\b/gi, 'working on'],
  [/\bseamlessly\b/gi, ''],
  [/\bholistic\b/gi, 'practical'],
];

const HUMAN_WRITING_PROMPT = `HUMAN VOICE (critical — must pass AI/bot detectors and read as the candidate wrote it):
- Write like a senior engineer drafting their own application, not a marketing bot or ChatGPT.
- Vary sentence length; use contractions where natural (I'm, we've, it's).
- Prefer concrete verbs: built, shipped, owned, debugged, migrated, cut, reduced, ran.
- Reference specific tools and outcomes from the resume only — no generic filler.
- BANNED words/phrases: excited to, passionate about, thrilled, leverage, utilize, cutting-edge, robust, synergy, delve, landscape, proven track record, dynamic team player, results-driven, seamlessly, holistic, at the forefront.
- Cover letter must end with the candidate's real name and personal email (never a noreply or app/system address).`;

function humanizeText(text = '') {
  let out = String(text);
  for (const [pattern, replacement] of BANNED_PHRASES) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/  +/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function humanizeKit(kit) {
  if (!kit) return kit;
  const next = { ...kit };

  if (next.coverLetterParagraph) {
    next.coverLetterParagraph = humanizeText(next.coverLetterParagraph);
  }
  if (next.resumeAddendum) {
    next.resumeAddendum = humanizeText(next.resumeAddendum);
  }
  if (Array.isArray(next.supplementPages)) {
    next.supplementPages = next.supplementPages.map((page) => ({
      ...page,
      content: humanizeText(page.content),
    }));
  }
  if (next.fullSupplementText) {
    next.fullSupplementText = humanizeText(next.fullSupplementText);
  }
  if (next.formatted) {
    next.formatted = humanizeText(next.formatted);
  }

  return next;
}

module.exports = {
  HUMAN_WRITING_PROMPT,
  humanizeText,
  humanizeKit,
};
