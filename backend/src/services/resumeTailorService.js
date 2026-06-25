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

const MIN_SUPPLEMENT_PAGES = 3;

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
  return missing.slice(0, 20);
}

function extractJdRequirements(jobDescription) {
  const lines = String(jobDescription || '')
    .split(/[\n•·\-]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 12 && l.length < 220);
  return lines.slice(0, 25);
}

function buildDemoSupplementPages(profile, job, jobDescription, missingKeywords) {
  const skills = (profile?.mustHaveSkills || []).slice(0, 10).join(', ') || 'cloud, DevOps, platform engineering';
  const reqs = extractJdRequirements(jobDescription).slice(0, 8);
  const name = profile?.displayName || 'Candidate';

  const page1 = {
    page: 1,
    title: 'Role alignment addendum (attach after base resume)',
    content: [
      `ADDENDUM FOR: ${job?.title || 'Role'} at ${job?.company || 'Company'}`,
      '',
      'SECTION A — How my background maps to this job description',
      '',
      ...reqs.map((r, i) => `${i + 1}. JD requirement: ${r}\n   Addendum bullet (if truthful): Relate your ${skills} experience to this requirement with a metric or scope.`),
      '',
      'SECTION B — Skills to emphasize from my existing resume',
      skills,
      '',
      'SECTION C — Keywords to mirror in ATS (only if accurate)',
      missingKeywords.join(', ') || 'Review full JD for tooling keywords',
    ].join('\n'),
  };

  const page2 = {
    page: 2,
    title: 'Technical depth & tools supplement',
    content: [
      'TECHNICAL SUPPLEMENT (additive — does not replace resume bullets)',
      '',
      '1. Infrastructure & automation',
      `   • Document Terraform/IaC patterns, modules, and environments you have supported.`,
      `   • CI/CD: pipelines owned, deployment frequency, rollback strategy.`,
      '',
      '2. Reliability & operations',
      '   • Incident response, on-call, SLO/SLA ownership, postmortem culture.',
      '   • Observability stack: metrics, logs, traces (Prometheus, Grafana, Datadog, etc.).',
      '',
      '3. Cloud & platform',
      '   • AWS/Azure/GCP services used at scale; networking, IAM, cost controls.',
      '   • Kubernetes/platform: clusters managed, GitOps, security baselines.',
      '',
      '4. Security & compliance (if in JD)',
      '   • Vault/secrets, SOC2/HIPAA exposure, least-privilege IAM.',
      '',
      `Tools from job description to address: ${missingKeywords.slice(0, 10).join(', ') || 'see full JD'}`,
    ].join('\n'),
  };

  const page3 = {
    page: 3,
    title: 'Application narrative, cover letter & ATS Q&A',
    content: [
      'COVER LETTER (full)',
      '',
      `Dear Hiring Team,`,
      '',
      `I am applying for the ${job?.title || 'position'} role at ${job?.company || 'your organization'}. My background in ${skills} aligns with the requirements outlined in your posting. I have delivered reliable cloud and platform outcomes — automation, observability, and secure deployments — in production environments.`,
      '',
      `I am particularly interested in ${job?.company || 'this team'} because the role emphasizes skills I use daily. I would welcome a conversation about how I can contribute to your platform goals.`,
      '',
      `Sincerely,`,
      `${name}`,
      '',
      '---',
      'LIKELY ATS SHORT-ANSWER PROMPTS (draft honestly)',
      '',
      '• Years of DevOps/SRE experience: [fill from resume]',
      '• Kubernetes production experience: [fill from resume]',
      '• Why this company: [1–2 sentences tied to JD]',
      '• Salary expectations: [your range]',
      '',
      'ATS KEYWORD GLOSSARY',
      missingKeywords.map((k) => `• ${k}`).join('\n'),
    ].join('\n'),
  };

  return [page1, page2, page3];
}

function buildDemoKit(profile, job, jobDescription) {
  const missingKeywords = inferMissingKeywords(profile, jobDescription);
  const supplementPages = buildDemoSupplementPages(profile, job, jobDescription, missingKeywords);
  const fullSupplementText = supplementPages.map((p) => `=== PAGE ${p.page}: ${p.title} ===\n\n${p.content}`).join('\n\n');

  return {
    mode: 'additive',
    tailored: true,
    demo: true,
    pageCount: supplementPages.length,
    supplementPages,
    fullSupplementText,
    missingKeywords,
    skillsToHighlight: (profile?.mustHaveSkills || []).slice(0, 12),
    additiveBullets: missingKeywords.slice(0, 8).map((kw) => ({
      section: 'Additional relevant experience',
      text: `Experience with ${kw} in production (include only if truthful).`,
    })),
    resumeAddendum: supplementPages[0]?.content?.slice(0, 1500) || '',
    coverLetterParagraph: supplementPages[2]?.content?.split('Sincerely,')[0]?.trim() || '',
    atsTips: [
      'Submit base resume unchanged, then attach this 3-page supplement as PDF or paste sections into ATS fields.',
      'Page 1: alignment · Page 2: technical depth · Page 3: cover letter + ATS answers.',
    ],
    guardrails:
      'Your base resume structure and bullets stay unchanged. This supplement is additive material for ATS and recruiters.',
    jobDescriptionLength: jobDescription.length,
  };
}

function parseKitJson(raw) {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleaned);
}

function normalizeKit(kit, profile, job, jobDescription, missingKeywords) {
  let supplementPages = kit.supplementPages || [];
  if (supplementPages.length < MIN_SUPPLEMENT_PAGES) {
    supplementPages = buildDemoSupplementPages(profile, job, jobDescription, missingKeywords);
  }

  const fullSupplementText =
    kit.fullSupplementText ||
    supplementPages.map((p) => `=== PAGE ${p.page}: ${p.title} ===\n\n${p.content}`).join('\n\n');

  return {
    ...kit,
    mode: 'additive',
    tailored: true,
    pageCount: supplementPages.length,
    supplementPages,
    fullSupplementText,
    missingKeywords: kit.missingKeywords?.length ? kit.missingKeywords : missingKeywords,
    jobDescriptionLength: jobDescription.length,
    guardrails:
      kit.guardrails ||
      'Base resume unchanged. Minimum 3-page additive supplement for ATS and human reviewers.',
  };
}

async function generateAdditiveKit({ profile, job, jobDescription }) {
  const missingKeywords = inferMissingKeywords(profile, jobDescription);
  const client = getClient();
  const fullJd = jobDescription.slice(0, 14000);

  if (!client) {
    return buildDemoKit(profile, job, fullJd);
  }

  const system = `You are an expert application strategist for senior DevOps/SRE/Platform engineers.

STRICT RULES:
1. NEVER rewrite, reorder, delete, or paraphrase the candidate's existing resume.
2. Produce an ADDITIVE supplement of at least ${MIN_SUPPLEMENT_PAGES} full pages (~450-700 words per page when printed).
3. Use the ENTIRE job description — map requirements to evidence from the resume only.
4. No invented employers, dates, certifications, or metrics.
5. Where experience is partial, use honest framing: "exposure to", "familiar with", "currently deepening".
6. Include tools, platforms, and responsibilities explicitly mentioned in the JD.

Return JSON only:
{
  "missingKeywords": ["from JD not in resume"],
  "skillsToHighlight": ["already on resume — emphasize for this JD"],
  "additiveBullets": [{"section":"string","text":"new bullet to ADD"}],
  "supplementPages": [
    {"page":1,"title":"Role alignment addendum","content":"full page text"},
    {"page":2,"title":"Technical depth & tools supplement","content":"full page text"},
    {"page":3,"title":"Cover letter & ATS Q&A","content":"full page text with cover letter + short answer drafts"}
  ],
  "coverLetterParagraph": "opening paragraph only",
  "atsTips": ["tip1","tip2"],
  "guardrails": "reminder"
}`;

  const user = `CANDIDATE RESUME (READ-ONLY — never modify):
${(profile?.resumeText || profile?.bio || 'No resume').slice(0, 8000)}

TARGET ROLES: ${(profile?.targetTitles || []).join(', ')}
MUST-HAVE: ${(profile?.mustHaveSkills || []).join(', ')}
GAPS DETECTED: ${missingKeywords.join(', ') || 'none'}

JOB: ${job?.title} at ${job?.company}
MATCH: ${job?.matchPct || job?.personalMatchPct || 0}%

FULL JOB DESCRIPTION:
${fullJd}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.45,
    max_tokens: 4500,
  });

  const raw = response.choices[0]?.message?.content?.trim() || '';
  try {
    const kit = parseKitJson(raw);
    return normalizeKit(kit, profile, job, fullJd, missingKeywords);
  } catch {
    const demo = buildDemoKit(profile, job, fullJd);
    demo.parseError = true;
    return demo;
  }
}

function formatKitAsText(kit) {
  const lines = [
    '=== APPLICATION KIT (additive — base resume unchanged) ===',
    kit.guardrails || '',
    `Pages: ${kit.pageCount || kit.supplementPages?.length || MIN_SUPPLEMENT_PAGES}`,
    '',
  ];

  if (kit.supplementPages?.length) {
    for (const page of kit.supplementPages) {
      lines.push(`--- PAGE ${page.page}: ${page.title} ---`, page.content, '');
    }
  }

  lines.push(
    '--- Keywords to mirror (if accurate) ---',
    ...(kit.missingKeywords || []).map((k) => `• ${k}`),
    '',
    '--- Skills to emphasize ---',
    ...(kit.skillsToHighlight || []).map((k) => `• ${k}`),
    '',
    '--- ATS tips ---',
    ...(kit.atsTips || []).map((t) => `• ${t}`)
  );

  return lines.join('\n').trim();
}

module.exports = {
  generateAdditiveKit,
  buildDemoKit,
  inferMissingKeywords,
  formatKitAsText,
  MIN_SUPPLEMENT_PAGES,
};
