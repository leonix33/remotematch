function normalizeKey(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(text = '') {
  return new Set(normalizeKey(text).split(' ').filter((t) => t.length > 2));
}

function jaccardSimilarity(a, b) {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (!setA.size && !setB.size) return 1;
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union ? intersection / union : 0;
}

function dedupeKey(job) {
  const url = (job.applyUrl || job.url || '').split('?')[0].toLowerCase();
  if (url) return `url:${url}`;
  return `tc:${normalizeKey(job.title)}|${normalizeKey(job.company)}`;
}

function isFuzzyDuplicate(a, b, threshold = 0.82) {
  if (normalizeKey(a.company) !== normalizeKey(b.company)) return false;
  const titleSim = jaccardSimilarity(a.title, b.title);
  const urlA = (a.applyUrl || a.url || '').split('?')[0];
  const urlB = (b.applyUrl || b.url || '').split('?')[0];
  if (urlA && urlB && urlA === urlB) return true;
  return titleSim >= threshold;
}

/**
 * Deduplicate jobs using applyUrl, title+company keys, and fuzzy title similarity.
 */
function deduplicateJobs(jobs, { fuzzyThreshold = 0.82 } = {}) {
  const byKey = new Map();
  const kept = [];

  for (const job of jobs) {
    const key = dedupeKey(job);
    if (byKey.has(key)) {
      const existing = byKey.get(key);
      if ((job.qualityScore || 0) > (existing.qualityScore || 0)) {
        const idx = kept.indexOf(existing);
        if (idx >= 0) kept[idx] = job;
        byKey.set(key, job);
      }
      continue;
    }

    let duplicate = false;
    for (const other of kept) {
      if (isFuzzyDuplicate(job, other, fuzzyThreshold)) {
        duplicate = true;
        if ((job.qualityScore || 0) > (other.qualityScore || 0)) {
          Object.assign(other, job);
        }
        break;
      }
    }
    if (!duplicate) {
      kept.push(job);
      byKey.set(key, job);
    }
  }

  return kept;
}

module.exports = {
  deduplicateJobs,
  dedupeKey,
  isFuzzyDuplicate,
  jaccardSimilarity,
  normalizeKey,
};
