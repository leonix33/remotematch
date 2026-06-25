const OpenAI = require('openai');
const env = require('../config/env');

const TECH_KEYWORDS = [
  'kubernetes', 'k8s', 'terraform', 'ansible', 'aws', 'azure', 'gcp', 'docker',
  'ci/cd', 'jenkins', 'github actions', 'gitlab', 'argocd', 'helm', 'prometheus',
  'grafana', 'datadog', 'splunk', 'elk', 'python', 'golang', 'linux', 'bash',
  'sre', 'devops', 'platform engineering', 'observability', 'incident response',
  'databricks', 'snowflake', 'kafka', 'redis', 'postgres', 'mongodb', 'vault',
  'istio', 'service mesh', 'lambda', 'ecs', 'eks', 'aks', 'gke', 'pulumi',
  'cloudformation', 'security', 'soc2', 'hipaa', 'pci', 'on-call', 'sla', 'slo',
];

function getClient() {
  if (!env.openaiApiKey) return null;
  return new OpenAI({ apiKey: env.openaiApiKey });
}

function normalize(text = '') {
  return String(text).toLowerCase();
}

function inferMissingKeywords(profile, jobDescription) {
  const blob = normalize(`${jobDescription} ${profile?.targetTitles?.join(' ') || ''}`);
  const resumeBlob = normalize(profile?.resumeText || '');
  const profileSkills = [
    ...(profile?.mustHaveSkills || []),
    ...(profile?.niceToHaveSkills || []),
    ...(profile?.extractedSkills || []),
  ].map(normalize);

  const missing = [];
  for (const keyword of TECH_KEYWORDS) {
    if (!blob.includes(keyword)) continue;
    const inResume = resumeBlob.includes(keyword) || profileSkills.some((s) => s.includes(keyword));
    if (!inResume) missing.push(keyword);
  }
  return missing.slice(0, 12);
}

function buildDemoKit(profile, job, jobDescription) {
  const missingKeywords = inferMissingKeywords(profile, jobDescription);
  const name = profile?.displayName || 'Candidate';
  const skills = (profile?.mustHaveSkills || []).slice(0, 6).join(', ') || 'cloud and platform engineering';

  return {
    mode: 'additive',
    tailored: true,
    demo: true,
    missingKeywords,
    skillsToHighlight: (profile?.mustHaveSkills || []).slice(0, 8),
    additiveBullets: missingKeywords.slice(0, 4).map((kw) => ({
      section: 'Additional relevant experience',
      text: `Hands-on experience with ${kw} in production environments (add only if truthful for your background).`,
    })),
    resumeAddendum:
      missingKeywords.length > 0
        ? `Additional keywords aligned to ${job?.company || 'this role'}: ${missingKeywords.join(', ')}.`
        : `Strong overlap with ${job?.title || 'this role'} based on your ${skills} background.`,
    coverLetterParagraph: `Dear Hiring Team,\n\nI am applying for the ${job?.title || 'role'} at ${job?.company || 'your company'}. My background in ${skills} maps directly to your requirements. I would welcome the chance to discuss how I can contribute.\n\nSincerely,\n${name}`,
    atsTips: [
      'Paste the resume addendum into the cover letter or additional info field — do not edit your base resume file.',
      'Mirror 3–5 keywords from the job description in your application answers where accurate.',
    ],
    guardrails:
      'Your base resume is unchanged. Only add the bullets and addendum below if they are truthful.',
  };
}

function parseKitJson(raw) {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleaned);
}

async function generateAdditiveKit({ profile, job, jobDescription }) {
  const missingKeywords = inferMissingKeywords(profile, jobDescription);
  const client = getClient();

  if (!client) {
    return buildDemoKit(profile, job, jobDescription);
  }

  const system = `You are an expert resume strategist for senior DevOps/SRE/Platform engineers.

STRICT RULES — never violate:
1. NEVER rewrite, reorder, delete, or paraphrase the candidate's existing resume bullets.
2. ONLY suggest NEW additive content: extra bullets, a short addendum paragraph, or keywords to weave into a cover letter.
3. Every additive bullet must be truthful based only on the resume provided — no invented employers, dates, or certifications.
4. If the candidate already covers a skill, do not suggest it again — highlight it in skillsToHighlight instead.
5. Keep tone professional and concise.

Respond with JSON only:
{
  "mode": "additive",
  "missingKeywords": ["keyword1"],
  "skillsToHighlight": ["existing skill to emphasize"],
  "additiveBullets": [{"section": "Skills|Additional experience|Certifications", "text": "new bullet to ADD"}],
  "resumeAddendum": "2-4 sentence paragraph to append at end of resume or paste in ATS additional info — additive only",
  "coverLetterParagraph": "4-6 sentence tailored paragraph for this job",
  "atsTips": ["tip1", "tip2"],
  "guardrails": "one sentence reminding user base resume stays unchanged"
}`;

  const user = `CANDIDATE RESUME (read-only — do not modify existing text):
${(profile?.resumeText || profile?.bio || 'No resume on file').slice(0, 6000)}

TARGET ROLES: ${(profile?.targetTitles || []).join(', ')}
MUST-HAVE SKILLS: ${(profile?.mustHaveSkills || []).join(', ')}
PRE-DETECTED GAPS: ${missingKeywords.join(', ') || 'none'}

JOB:
Title: ${job?.title || 'Unknown'}
Company: ${job?.company || 'Unknown'}
Match: ${job?.matchPct || job?.personalMatchPct || 0}%

JOB DESCRIPTION:
${jobDescription.slice(0, 8000)}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.4,
    max_tokens: 900,
  });

  const raw = response.choices[0]?.message?.content?.trim() || '';
  try {
    const kit = parseKitJson(raw);
    return {
      ...kit,
      mode: 'additive',
      tailored: true,
      demo: false,
      missingKeywords: kit.missingKeywords?.length ? kit.missingKeywords : missingKeywords,
    };
  } catch {
    const demo = buildDemoKit(profile, job, jobDescription);
    demo.parseError = true;
    return demo;
  }
}

function formatKitAsText(kit) {
  const lines = [
    '=== APPLICATION KIT (additive — base resume unchanged) ===',
    kit.guardrails || '',
    '',
    '--- Keywords to mirror (if accurate) ---',
    ...(kit.missingKeywords || []).map((k) => `• ${k}`),
    '',
    '--- Skills to emphasize (already on your resume) ---',
    ...(kit.skillsToHighlight || []).map((k) => `• ${k}`),
    '',
    '--- Additive bullets (add only if truthful) ---',
    ...(kit.additiveBullets || []).map((b, i) => `${i + 1}. [${b.section}] ${b.text}`),
    '',
    '--- Resume addendum (paste in cover letter / additional info field) ---',
    kit.resumeAddendum || '',
    '',
    '--- Cover letter paragraph ---',
    kit.coverLetterParagraph || '',
    '',
    '--- ATS tips ---',
    ...(kit.atsTips || []).map((t) => `• ${t}`),
  ];
  return lines.join('\n').trim();
}

module.exports = {
  generateAdditiveKit,
  buildDemoKit,
  inferMissingKeywords,
  formatKitAsText,
};
