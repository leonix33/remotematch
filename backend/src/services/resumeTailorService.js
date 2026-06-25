const openaiService = require('./openaiService');
const env = require('../config/env');
const { contactHeader, contactSignature } = require('./applicantContactService');
const { HUMAN_WRITING_PROMPT, humanizeKit } = require('./humanizeWritingService');

const TECH_KEYWORDS = [
  'kubernetes', 'k8s', 'terraform', 'ansible', 'aws', 'azure', 'gcp', 'docker',
  'ci/cd', 'jenkins', 'github actions', 'gitlab', 'argocd', 'helm', 'prometheus',
  'grafana', 'datadog', 'splunk', 'elk', 'python', 'golang', 'linux', 'bash',
  'sre', 'devops', 'platform engineering', 'observability', 'incident response',
  'databricks', 'snowflake', 'kafka', 'redis', 'postgres', 'mongodb', 'vault',
  'istio', 'service mesh', 'lambda', 'ecs', 'eks', 'aks', 'gke', 'pulumi',
  'cloudformation', 'security', 'soc2', 'hipaa', 'pci', 'on-call', 'sla', 'slo',
];

const MIN_SUPPLEMENT_PAGES = 1;
const MAX_SUPPLEMENT_PAGES = 6;
const DEFAULT_SUPPLEMENT_PAGES = 3;

function clampPageCount(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return DEFAULT_SUPPLEMENT_PAGES;
  return Math.min(MAX_SUPPLEMENT_PAGES, Math.max(MIN_SUPPLEMENT_PAGES, Math.round(v)));
}

function highMatchPromptBlock(targetPct = 90) {
  return `HIGH MATCH MODE (target ~${targetPct}% ATS/skill alignment via additive supplement only):
- Map EVERY major JD requirement to candidate evidence — requirement-by-requirement.
- Mirror exact phrases, tool names, and title variants from the posting where truthful (word-for-word ATS alignment).
- Include a dedicated "JD phrase → my evidence" section using the employer's wording.
- Do not invent experience; use honest framing where partial.
- Goal: maximize keyword overlap so combined base resume + supplement reads as ~${targetPct}% fit to the JD.`;
}

async function getClient(userId) {
  return openaiService.getClient(userId);
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

function buildDemoSupplementPages(profile, job, jobDescription, missingKeywords, contact = {}, options = {}) {
  const pageTarget = clampPageCount(options.supplementPages ?? DEFAULT_SUPPLEMENT_PAGES);
  const highMatch = options.tailorMode === 'high_match';
  const skills = (profile?.mustHaveSkills || []).slice(0, 10).join(', ') || 'cloud, DevOps, platform engineering';
  const reqs = extractJdRequirements(jobDescription);
  const name = contact.name || profile?.displayName || 'Candidate';
  const header = contactHeader(contact);
  const signature = contactSignature(contact);

  const pages = [];

  pages.push({
    page: 1,
    title: highMatch ? 'JD phrase alignment (word-for-word where truthful)' : 'Role alignment addendum (attach after base resume)',
    content: [
      header ? `${header}\n` : '',
      `ADDENDUM FOR: ${job?.title || 'Role'} at ${job?.company || 'Company'}`,
      highMatch ? `TARGET: ~${options.highMatchTarget || 90}% match via additive supplement` : '',
      '',
      highMatch ? 'SECTION — JD phrase → my evidence' : 'SECTION A — How my background maps to this job description',
      '',
      ...reqs.slice(0, Math.max(4, pageTarget + 2)).map(
        (r, i) =>
          highMatch
            ? `${i + 1}. JD: "${r}"\n   Evidence from my resume (use exact JD terms where accurate): [map your ${skills} work to this line]`
            : `${i + 1}. JD requirement: ${r}\n   Addendum bullet (if truthful): Relate your ${skills} experience with a metric or scope.`
      ),
      '',
      'Keywords to mirror (if accurate):',
      missingKeywords.join(', ') || 'See full JD',
    ]
      .filter(Boolean)
      .join('\n'),
  });

  if (pageTarget >= 2) {
    pages.push({
      page: 2,
      title: 'Technical depth & tools supplement',
      content: [
        'TECHNICAL SUPPLEMENT (additive — does not replace resume bullets)',
        '',
        '1. Infrastructure & automation — Terraform/IaC, CI/CD pipelines, deployment frequency.',
        '2. Reliability & operations — on-call, SLO/SLA, observability (metrics, logs, traces).',
        '3. Cloud & platform — AWS/Azure/GCP, Kubernetes, GitOps, IAM, cost controls.',
        '4. Security & compliance — Vault/secrets, SOC2/HIPAA if in JD.',
        '',
        `JD tools to address verbatim: ${missingKeywords.slice(0, 12).join(', ') || 'see full JD'}`,
      ].join('\n'),
    });
  }

  const coverPageNum = pageTarget >= 3 ? 3 : pageTarget;
  pages.push({
    page: coverPageNum,
    title: 'Cover letter & ATS Q&A',
    content: [
      'COVER LETTER',
      '',
      `Hi —`,
      '',
      `I'm applying for the ${job?.title || 'position'} at ${job?.company || 'your team'}. I've been working on ${skills} in production.`,
      highMatch
        ? `I've mapped my background to your posting line-by-line in the addendum — same tools and responsibilities you listed, where I've done that work.`
        : `What caught my eye is the mix of platform work and hands-on ops — that's what I do day to day.`,
      '',
      `Thanks for your time,`,
      signature || name,
      '',
      'ATS SHORT-ANSWER DRAFTS (honest)',
      '• Years of experience: [from resume]',
      '• Why this role: [tie to JD phrases]',
      '',
      'ATS KEYWORD GLOSSARY',
      missingKeywords.map((k) => `• ${k}`).join('\n'),
    ].join('\n'),
  });

  let nextPage = pages.length + 1;
  while (pages.length < pageTarget) {
    const chunk = reqs.slice((nextPage - 4) * 3, (nextPage - 4) * 3 + 3);
    pages.push({
      page: nextPage,
      title: highMatch ? `JD requirement mapping (continued)` : `Role depth supplement (page ${nextPage})`,
      content: [
        highMatch
          ? 'Continue word-for-word JD alignment — quote the posting, then your evidence:'
          : 'Additional role-specific depth mapped to the job description:',
        '',
        ...(chunk.length
          ? chunk.map((r, i) => `${i + 1}. "${r}" → [your relevant experience]`)
          : [`${nextPage - 3}. Expand on ${skills} outcomes tied to ${job?.company || 'this role'}.`]),
        '',
        `Tools: ${missingKeywords.slice(0, 8).join(', ')}`,
      ].join('\n'),
    });
    nextPage += 1;
  }

  return pages.slice(0, pageTarget).map((p, i) => ({ ...p, page: i + 1 }));
}

function buildDemoKit(profile, job, jobDescription, contact = {}, options = {}) {
  const pageTarget = clampPageCount(options.supplementPages ?? DEFAULT_SUPPLEMENT_PAGES);
  const tailorMode = options.tailorMode === 'high_match' ? 'high_match' : 'balanced';
  const missingKeywords = inferMissingKeywords(profile, jobDescription);
  const supplementPages = buildDemoSupplementPages(profile, job, jobDescription, missingKeywords, contact, {
    ...options,
    supplementPages: pageTarget,
    tailorMode,
  });
  const fullSupplementText = supplementPages.map((p) => `=== PAGE ${p.page}: ${p.title} ===\n\n${p.content}`).join('\n\n');
  const coverPage = supplementPages.find((p) => p.title.toLowerCase().includes('cover')) || supplementPages[supplementPages.length - 1];

  const kit = humanizeKit({
    mode: 'additive',
    tailored: true,
    demo: true,
    tailorMode,
    supplementPagesTarget: pageTarget,
    highMatchTarget: options.highMatchTarget || 90,
    estimatedMatchPct: Math.min(95, (job?.personalMatchPct ?? job?.matchPct ?? 70) + (tailorMode === 'high_match' ? 15 : 5)),
    pageCount: supplementPages.length,
    supplementPages,
    fullSupplementText,
    missingKeywords,
    skillsToHighlight: (profile?.mustHaveSkills || []).slice(0, 12),
    additiveBullets: missingKeywords.slice(0, 8).map((kw) => ({
      section: 'Additional relevant experience',
      text: `Hands-on with ${kw} in production (include only if truthful).`,
    })),
    resumeAddendum: supplementPages[0]?.content?.slice(0, 1500) || '',
    coverLetterParagraph: coverPage?.content?.split('Thanks for your time,')[0]?.trim() || '',
    contactEmail: contact.email || '',
    contactName: contact.name || profile?.displayName || '',
    atsTips: [
      'Submit base resume unchanged, then attach this 3-page supplement as PDF or paste sections into ATS fields.',
      'Page 1: alignment · Page 2: technical depth · Page 3: cover letter + ATS answers.',
      'Use your personal email on forms — not a system or noreply address.',
    ],
    guardrails:
      'Your base resume structure and bullets stay unchanged. This supplement is additive material for ATS and recruiters. Written in a direct, human voice.',
    jobDescriptionLength: jobDescription.length,
  });

  return kit;
}

function parseKitJson(raw) {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleaned);
}

function normalizeKit(kit, profile, job, jobDescription, missingKeywords, contact = {}, options = {}) {
  const pageTarget = clampPageCount(options.supplementPages ?? kit.supplementPagesTarget ?? DEFAULT_SUPPLEMENT_PAGES);
  let supplementPages = kit.supplementPages || [];
  if (supplementPages.length < pageTarget) {
    supplementPages = buildDemoSupplementPages(profile, job, jobDescription, missingKeywords, contact, options);
  } else if (supplementPages.length > pageTarget) {
    supplementPages = supplementPages.slice(0, pageTarget).map((p, i) => ({ ...p, page: i + 1 }));
  }

  const tailorMode = options.tailorMode === 'high_match' ? 'high_match' : kit.tailorMode || 'balanced';
  const baseMatch = job?.personalMatchPct ?? job?.matchPct ?? 70;
  const estimatedMatchPct = Math.min(
    98,
    kit.estimatedMatchPct ??
      baseMatch + (tailorMode === 'high_match' ? Math.max(8, (options.highMatchTarget || 90) - baseMatch) : 4)
  );

  const fullSupplementText =
    kit.fullSupplementText ||
    supplementPages.map((p) => `=== PAGE ${p.page}: ${p.title} ===\n\n${p.content}`).join('\n\n');

  return humanizeKit({
    ...kit,
    mode: 'additive',
    tailored: true,
    tailorMode,
    supplementPagesTarget: pageTarget,
    highMatchTarget: options.highMatchTarget || kit.highMatchTarget || 90,
    estimatedMatchPct,
    pageCount: supplementPages.length,
    supplementPages,
    fullSupplementText,
    missingKeywords: kit.missingKeywords?.length ? kit.missingKeywords : missingKeywords,
    contactEmail: contact.email || kit.contactEmail || '',
    contactName: contact.name || kit.contactName || profile?.displayName || '',
    jobDescriptionLength: jobDescription.length,
    guardrails:
      kit.guardrails ||
      'Base resume unchanged. Minimum 3-page additive supplement for ATS and human reviewers. Uses your personal contact email.',
  });
}

async function generateAdditiveKit({
  userId,
  profile,
  job,
  jobDescription,
  contact = {},
  tailorFocus = '',
  supplementPages = DEFAULT_SUPPLEMENT_PAGES,
  tailorMode = 'balanced',
  highMatchTarget = 90,
}) {
  const pageTarget = clampPageCount(supplementPages);
  const options = { supplementPages: pageTarget, tailorMode, highMatchTarget };
  const missingKeywords = inferMissingKeywords(profile, jobDescription);
  const client = userId ? await getClient(userId) : null;
  const fullJd = jobDescription.slice(0, 14000);

  if (!client) {
    return buildDemoKit(profile, job, fullJd, contact, options);
  }

  const contactBlock = contactHeader(contact);
  const highMatchBlock = tailorMode === 'high_match' ? `\n\n${highMatchPromptBlock(highMatchTarget)}` : '';
  const system = `You are an expert application strategist for senior DevOps/SRE/Platform engineers.

STRICT RULES:
1. NEVER rewrite, reorder, delete, or paraphrase the candidate's existing resume.
2. Produce an ADDITIVE supplement of exactly ${pageTarget} full pages (~450-700 words per page when printed).
3. Use the ENTIRE job description — map requirements to evidence from the resume only.
4. No invented employers, dates, certifications, or metrics.
5. Where experience is partial, use honest framing: "exposure to", "familiar with", "currently deepening".
6. Include tools, platforms, and responsibilities explicitly mentioned in the JD.
7. Page 1 must start with the candidate contact header (name, personal email, phone/LinkedIn if provided).
8. Final page must include cover letter signing off with name and personal email: ${contact.email || '[candidate email from profile]'}.
9. NEVER use app, noreply, admin, or system email addresses.
${highMatchBlock}

${HUMAN_WRITING_PROMPT}

Return JSON only:
{
  "missingKeywords": ["from JD not in resume"],
  "skillsToHighlight": ["already on resume — emphasize for this JD"],
  "additiveBullets": [{"section":"string","text":"new bullet to ADD"}],
  "supplementPages": [
    {"page":1,"title":"string","content":"full page text"}
  ],
  "estimatedMatchPct": number,
  "coverLetterParagraph": "opening paragraph only",
  "atsTips": ["tip1","tip2"],
  "guardrails": "reminder"
}
You MUST return exactly ${pageTarget} entries in supplementPages.`;

  const user = `CANDIDATE CONTACT (use on cover letter and page 1 header — personal email only):
${contactBlock || `${contact.name || 'Candidate'}\n${contact.email || ''}`}

CANDIDATE RESUME (READ-ONLY — never modify):
${(profile?.resumeText || profile?.bio || 'No resume').slice(0, 8000)}

TARGET ROLES: ${(profile?.targetTitles || []).join(', ')}
MUST-HAVE: ${(profile?.mustHaveSkills || []).join(', ')}
GAPS DETECTED: ${missingKeywords.join(', ') || 'none'}

JOB: ${job?.title} at ${job?.company}
CURRENT MATCH: ${job?.matchPct || job?.personalMatchPct || 0}%
TAILOR MODE: ${tailorMode}
TARGET PAGES: ${pageTarget}
${tailorMode === 'high_match' ? `TARGET MATCH AFTER SUPPLEMENT: ~${highMatchTarget}%` : ''}

FULL JOB DESCRIPTION:
${fullJd}${tailorFocus ? `\n\nCANDIDATE RETAILOR NOTES (emphasize for this specific role):\n${String(tailorFocus).slice(0, 1500)}` : ''}`;

  const maxTokens = Math.min(8000, 1200 + pageTarget * 900);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: tailorMode === 'high_match' ? 0.48 : 0.52,
    max_tokens: maxTokens,
  });

  const raw = response.choices[0]?.message?.content?.trim() || '';
  try {
    const kit = parseKitJson(raw);
    return normalizeKit(kit, profile, job, fullJd, missingKeywords, contact, options);
  } catch {
    const demo = buildDemoKit(profile, job, fullJd, contact, options);
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
  clampPageCount,
  MIN_SUPPLEMENT_PAGES,
  MAX_SUPPLEMENT_PAGES,
  DEFAULT_SUPPLEMENT_PAGES,
};
