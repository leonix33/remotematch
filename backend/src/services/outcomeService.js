const Outcome = require('../models/Outcome');
const env = require('../config/env');
const OpenAI = require('openai');

function requireMongo() {
  if (!env.mongoUri) throw new Error('MongoDB is required');
}

async function upsert(userId, data) {
  requireMongo();
  return Outcome.findOneAndUpdate(
    { userId, jobId: data.jobId },
    { userId, ...data },
    { upsert: true, new: true }
  );
}

async function list(userId) {
  requireMongo();
  return Outcome.find({ userId }).sort({ updatedAt: -1 }).lean();
}

async function insights(userId) {
  requireMongo();
  const outcomes = await Outcome.find({ userId }).lean();
  const total = outcomes.length;
  const offers = outcomes.filter((o) => o.stage === 'offer').length;
  const onsites = outcomes.filter((o) => o.stage === 'onsite').length;
  const applied = outcomes.filter((o) => o.stage === 'applied').length;
  const avgMatch =
    outcomes.filter((o) => o.matchPct).reduce((s, o) => s + o.matchPct, 0) /
      (outcomes.filter((o) => o.matchPct).length || 1);

  let aiInsight = 'Track more outcomes to unlock AI learning.';
  if (env.openaiApiKey && total >= 3) {
    const client = new OpenAI({ apiKey: env.openaiApiKey });
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Analyze job search outcomes. Give 3 actionable insights in bullet points.' },
        {
          role: 'user',
          content: JSON.stringify({ total, offers, onsites, applied, avgMatch, stages: outcomes.map((o) => o.stage) }),
        },
      ],
      max_tokens: 300,
    });
    aiInsight = response.choices[0]?.message?.content?.trim() || aiInsight;
  }

  return {
    stats: { total, offers, onsites, applied, avgMatch: Math.round(avgMatch) },
    conversionRate: total ? Math.round((offers / total) * 100) : 0,
    aiInsight,
  };
}

module.exports = { upsert, list, insights };
