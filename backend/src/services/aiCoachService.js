const OpenAI = require('openai');
const env = require('../config/env');
const AiChatSession = require('../models/AiChatSession');
const profileService = require('./profileService');

const SYSTEM_PROMPT = `You are RemoteMatch AI Coach — a sharp, encouraging career advisor for remote tech job seekers.
You help with: resume tips, interview prep, salary negotiation, job match analysis, cover letters, and application strategy.
Keep answers concise (2-4 short paragraphs max). Be specific and actionable. Reference DevOps, SRE, Cloud, Platform, and Data engineering when relevant.
If you lack context, ask one clarifying question. Never invent job listings or company facts.`;

function requireMongo() {
  if (!env.mongoUri) throw new Error('MongoDB is required for AI chat');
}

async function getSession(userId) {
  requireMongo();
  let session = await AiChatSession.findOne({ userId });
  if (!session) {
    session = await AiChatSession.create({ userId, messages: [] });
  }
  return session;
}

async function chat(userId, userMessage) {
  requireMongo();
  const profile = await profileService.getOrCreate(userId);
  const session = await getSession(userId);

  const profileContext = profile.onboardingComplete
    ? `\nUser profile: ${profile.displayName || 'User'}, targets: ${(profile.targetTitles || []).slice(0, 3).join(', ')}, skills: ${(profile.mustHaveSkills || []).slice(0, 6).join(', ')}.`
    : '';

  session.messages.push({ role: 'user', content: userMessage });
  const history = session.messages.slice(-20).map((m) => ({ role: m.role, content: m.content }));

  let reply;
  if (env.openaiApiKey) {
    const client = new OpenAI({ apiKey: env.openaiApiKey });
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + profileContext },
        ...history,
      ],
      temperature: 0.7,
      max_tokens: 600,
    });
    reply = response.choices[0]?.message?.content?.trim() || 'I could not generate a response. Try again.';
  } else {
    reply = `[Demo mode — set OPENAI_API_KEY for live AI]\n\nGreat question about "${userMessage.slice(0, 80)}". Focus on quantifying impact on your resume, tailor each application to the job description, and prioritize roles with 65%+ skill overlap. Want help with a specific company or interview round?`;
  }

  session.messages.push({ role: 'assistant', content: reply });
  if (session.messages.length > 50) {
    session.messages = session.messages.slice(-50);
  }
  await session.save();

  return { reply, demo: !env.openaiApiKey };
}

async function getHistory(userId) {
  requireMongo();
  const session = await getSession(userId);
  return session.messages.map((m) => ({
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
  }));
}

async function clearHistory(userId) {
  requireMongo();
  await AiChatSession.findOneAndUpdate({ userId }, { messages: [] });
}

module.exports = { chat, getHistory, clearHistory };
