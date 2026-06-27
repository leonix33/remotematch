const challenges = new Map();

function setChallenge(key, challenge, ttlMs = 5 * 60 * 1000) {
  challenges.set(key, { challenge, expiresAt: Date.now() + ttlMs });
}

function consumeChallenge(key) {
  const entry = challenges.get(key);
  if (!entry) return null;
  challenges.delete(key);
  if (Date.now() > entry.expiresAt) return null;
  return entry.challenge;
}

module.exports = { setChallenge, consumeChallenge };
