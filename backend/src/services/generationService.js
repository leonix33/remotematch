const OpenAI = require('openai');
const env = require('../config/env');
const Generation = require('../models/Generation');
const profileService = require('./profileService');

async function generateCoverLetter({ jobTitle, company, tone, goal, userId }) {
  const profile = await profileService.getOrCreate(userId);
  const name = profile.displayName || 'Applicant';
  const skills = (profile.mustHaveSkills || []).slice(0, 8).join(', ');
  const titles = (profile.targetTitles || []).slice(0, 3).join(', ');

  const prompt = `Write a concise cover letter for a ${jobTitle} role at ${company}.
Applicant: ${name}
Target roles: ${titles || 'cloud/devops/platform engineering'}
Key skills: ${skills || 'cloud, devops, infrastructure'}
Tone: ${tone}. Goal: ${goal}.
Keep it under 200 words, professional, and specific.`;

  let content;
  if (env.openaiApiKey) {
    const client = new OpenAI({ apiKey: env.openaiApiKey });
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You write sharp, honest job application copy.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });
    content = response.choices[0]?.message?.content?.trim() || '';
  } else {
    content = `[Demo mode — add OPENAI_API_KEY for live AI]\n\nDear Hiring Team,\n\nI am excited to apply for the ${jobTitle} position at ${company}. My background in ${skills || 'cloud engineering and DevOps'} aligns well with your needs. I would welcome the opportunity to contribute to your team.\n\nSincerely,\n${name}`;
  }

  if (env.mongoUri) {
    await Generation.create({
      jobTitle,
      company,
      tone,
      prompt,
      content,
      createdBy: userId,
      platform: 'cover-letter',
    });
  }

  return { content, demo: !env.openaiApiKey };
}

module.exports = { generateCoverLetter };
