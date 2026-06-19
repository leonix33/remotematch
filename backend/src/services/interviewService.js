const OpenAI = require('openai');
const env = require('../config/env');
const InterviewSession = require('../models/InterviewSession');
const profileService = require('./profileService');

function requireMongo() {
  if (!env.mongoUri) throw new Error('MongoDB is required');
}

async function start(userId, { jobTitle, company, mode = 'text' }) {
  requireMongo();
  const session = await InterviewSession.create({
    userId,
    jobTitle,
    company,
    mode,
    turns: [
      {
        role: 'interviewer',
        content: `Thanks for joining. I'm the hiring manager for ${jobTitle} at ${company}. Let's start — tell me about a challenging production incident you handled and how you resolved it.`,
      },
    ],
  });
  return session;
}

async function respond(userId, sessionId, candidateAnswer) {
  requireMongo();
  const session = await InterviewSession.findOne({ _id: sessionId, userId, active: true });
  if (!session) throw new Error('Session not found');

  session.turns.push({ role: 'candidate', content: candidateAnswer });

  let reply;
  if (env.openaiApiKey) {
    const profile = await profileService.getOrCreate(userId);
    const client = new OpenAI({ apiKey: env.openaiApiKey });
    const history = session.turns.slice(-8).map((t) => ({
      role: t.role === 'interviewer' ? 'assistant' : 'user',
      content: t.content,
    }));
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a tough but fair hiring manager interviewing for ${session.jobTitle} at ${session.company}. Ask one follow-up at a time. Candidate background: ${profile.headline || ''}. After 4-5 exchanges, wrap up.`,
        },
        ...history,
      ],
      max_tokens: 300,
    });
    reply = response.choices[0]?.message?.content?.trim() || 'Interesting. Tell me more.';
  } else {
    reply = `[Demo] Good answer. How would you design observability for a distributed system at ${session.company}?`;
  }

  session.turns.push({ role: 'interviewer', content: reply });
  await session.save();
  return { turn: reply, turnCount: session.turns.filter((t) => t.role === 'candidate').length };
}

async function endSession(userId, sessionId) {
  requireMongo();
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) throw new Error('Session not found');

  let feedback;
  if (env.openaiApiKey) {
    const client = new OpenAI({ apiKey: env.openaiApiKey });
    const transcript = session.turns.map((t) => `${t.role}: ${t.content}`).join('\n');
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Score interview 0-100. Give strengths, improvements, and overall verdict in markdown.' },
        { role: 'user', content: transcript },
      ],
      max_tokens: 500,
    });
    feedback = response.choices[0]?.message?.content?.trim() || 'Session complete.';
    const scoreMatch = feedback.match(/(\d{1,3})\s*\/\s*100|score[:\s]+(\d{1,3})/i);
    session.score = scoreMatch ? Number(scoreMatch[1] || scoreMatch[2]) : 70;
  } else {
    feedback = '[Demo] Solid communication. Practice STAR format and system design depth.';
    session.score = 72;
  }

  session.summary = feedback;
  session.active = false;
  session.turns.push({ role: 'feedback', content: feedback });
  await session.save();
  return { score: session.score, summary: feedback };
}

async function listSessions(userId) {
  requireMongo();
  return InterviewSession.find({ userId }).sort({ updatedAt: -1 }).limit(20).lean();
}

module.exports = { start, respond, endSession, listSessions };
