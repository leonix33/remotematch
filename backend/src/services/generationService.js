const OpenAI = require('openai');
const env = require('../config/env');
const Generation = require('../models/Generation');
const profileService = require('./profileService');
const applicantContactService = require('./applicantContactService');
const { HUMAN_WRITING_PROMPT, humanizeText } = require('./humanizeWritingService');

async function generateCoverLetter({ jobTitle, company, tone, goal, userId, authEmail }) {
  const profile = await profileService.getOrCreate(userId);
  const contact = await applicantContactService.resolveApplicantContact(userId, profile, authEmail);
  const name = contact.name || 'Applicant';
  const email = contact.email || '';
  const skills = (profile.mustHaveSkills || []).slice(0, 8).join(', ');
  const titles = (profile.targetTitles || []).slice(0, 3).join(', ');

  const prompt = `Write a concise cover letter for a ${jobTitle} role at ${company}.
Applicant: ${name}
Personal email for signature: ${email || 'use profile email'}
Target roles: ${titles || 'cloud/devops/platform engineering'}
Key skills: ${skills || 'cloud, devops, infrastructure'}
Tone: ${tone}. Goal: ${goal}.
Keep it under 200 words. Sign off with name and personal email. ${HUMAN_WRITING_PROMPT}`;

  let content;
  if (env.openaiApiKey) {
    const client = new OpenAI({ apiKey: env.openaiApiKey });
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You write direct, human job application copy that does not sound AI-generated.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.55,
      max_tokens: 400,
    });
    content = humanizeText(response.choices[0]?.message?.content?.trim() || '');
  } else {
    content = humanizeText(
      `Hi —\n\nI'm applying for the ${jobTitle} role at ${company}. I've been working on ${skills || 'cloud engineering and DevOps'} in production and think the fit is strong.\n\nHappy to chat,\n${name}${email ? `\n${email}` : ''}`
    );
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
