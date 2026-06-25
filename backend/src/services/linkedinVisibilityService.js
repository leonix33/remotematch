const crypto = require('crypto');
const OpenAI = require('openai');
const env = require('../config/env');
const profileService = require('./profileService');
const linkedinVisibilityStore = require('./linkedinVisibilityStore');

function getClient() {
  if (!env.openaiApiKey) return null;
  return new OpenAI({ apiKey: env.openaiApiKey });
}

function profileContext(profile) {
  return {
    name: profile.displayName || 'Candidate',
    headline: profile.headline || '',
    skills: [
      ...(profile.mustHaveSkills || []),
      ...(profile.niceToHaveSkills || []),
      ...(profile.extractedSkills || []).slice(0, 12),
    ],
    titles: profile.targetTitles || [],
    resumeSnippet: (profile.resumeText || '').slice(0, 1200),
    github: profile.github || '',
    portfolio: profile.portfolio || '',
  };
}

function buildDemoProjects(ctx, count = 3) {
  const skills = ctx.skills.length ? ctx.skills : ['terraform', 'kubernetes', 'aws', 'ci/cd'];
  const templates = [
    {
      title: 'Terraform module: production-ready EKS baseline',
      summary: 'A reusable module that provisions EKS with node groups, IRSA, and cluster autoscaler — documented for hiring managers.',
      techStack: ['terraform', 'aws', 'eks', 'kubernetes'],
      postType: 'build_in_public',
    },
    {
      title: 'GitHub Actions pipeline: test → scan → deploy',
      summary: 'End-to-end CI/CD with unit tests, Trivy scan, and staged deploy to a dev cluster.',
      techStack: ['github actions', 'docker', 'kubernetes', 'devops'],
      postType: 'project_showcase',
    },
    {
      title: 'Observability mini-lab: Prometheus + Grafana dashboards',
      summary: 'Instrument a sample app and publish SLO-style dashboards with alert runbooks.',
      techStack: ['prometheus', 'grafana', 'observability', 'sre'],
      postType: 'lesson_learned',
    },
    {
      title: 'Cost guardrails for cloud infrastructure',
      summary: 'Budget alerts + tagging policy demo showing FinOps habits for platform teams.',
      techStack: ['aws', 'terraform', 'finops', 'cloud'],
      postType: 'build_in_public',
    },
  ];

  return templates.slice(0, count).map((t, i) => {
    const stack = [...new Set([...t.techStack, ...skills.slice(0, 3)])].slice(0, 6);
    const hook = `Weekend build idea for ${ctx.titles[0] || 'platform engineers'}:`;
    const post = `${hook}\n\nI'm documenting a small project — **${t.title}**.\n\n${t.summary}\n\nStack: ${stack.join(' · ')}\n\nWhy this matters for hiring managers: it shows how I design reliable, repeatable infrastructure — not just run commands.\n\n${ctx.github ? `Repo: ${ctx.github}\n\n` : ''}Who else is building in public while job searching? Drop your latest project below.\n\n#DevOps #CloudEngineering #RemoteJobs #${stack[0]?.replace(/\s+/g, '') || 'PlatformEngineering'}`;
    return {
      id: `demo-${Date.now()}-${i}`,
      title: t.title,
      summary: t.summary,
      techStack: stack,
      buildSteps: [
        'Define scope and success criteria (1 page README).',
        'Implement the core automation or pipeline.',
        'Add a short demo video or screenshot carousel.',
        'Publish post with lessons learned — not just features.',
      ],
      linkedinPost: post,
      hashtags: ['#DevOps', '#CloudEngineering', '#RemoteJobs', '#PlatformEngineering', '#SRE'],
      postType: t.postType,
      estimatedHours: 4 + i * 2,
      visibilityTip: 'Post Tuesday–Thursday morning in your timezone for best reach.',
      status: 'draft',
      demo: true,
      createdAt: new Date().toISOString(),
    };
  });
}

function parseProjects(raw) {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  const data = JSON.parse(cleaned);
  const projects = Array.isArray(data) ? data : data.projects || [];
  return projects.map((p, i) => ({
    id: crypto.randomBytes(8).toString('hex'),
    title: p.title || `Project idea ${i + 1}`,
    summary: p.summary || '',
    techStack: p.techStack || [],
    buildSteps: p.buildSteps || [],
    linkedinPost: p.linkedinPost || '',
    hashtags: p.hashtags || [],
    postType: p.postType || 'build_in_public',
    estimatedHours: p.estimatedHours || 6,
    visibilityTip: p.visibilityTip || 'Pair each project post with 2 thoughtful comments on peers’ posts the same week.',
    status: 'draft',
    demo: false,
    createdAt: new Date().toISOString(),
  }));
}

async function generateProjects(userId, options = {}) {
  const count = Math.min(Math.max(Number(options.count) || 3, 1), 6);
  const focus = (options.focus || 'devops_portfolio').trim();
  const profile = await profileService.getOrCreate(userId);
  const ctx = profileContext(profile);

  if (!(ctx.resumeSnippet || '').trim() && !ctx.skills.length) {
    const err = new Error('Add resume text or skills in Profile so we can suggest credible project ideas.');
    err.status = 400;
    throw err;
  }

  const client = getClient();
  if (!client) {
    const demo = buildDemoProjects(ctx, count);
    return linkedinVisibilityStore.saveMany(userId, demo);
  }

  const system = `You help job-seeking DevOps/SRE/Platform engineers build LinkedIn visibility ethically.

RULES:
1. Suggest REALISTIC weekend-scale projects (4–12 hours) aligned to the candidate's actual skills.
2. Do NOT invent employers, certifications, or completed work they did not do.
3. Use honest framing: "build in public", "documenting a lab", "weekend project" when appropriate.
4. Each LinkedIn post: hook line, 3–5 short paragraphs, stack line, soft CTA, 4–6 hashtags.
5. Projects should attract recruiters/hiring managers in cloud/platform engineering.

Return JSON array of ${count} objects:
[{"title":"","summary":"","techStack":[],"buildSteps":[],"linkedinPost":"","hashtags":[],"postType":"build_in_public|project_showcase|lesson_learned","estimatedHours":6,"visibilityTip":""}]`;

  const user = `Candidate: ${ctx.name}
Headline: ${ctx.headline}
Target roles: ${ctx.titles.join(', ')}
Skills: ${ctx.skills.join(', ')}
Focus: ${focus}
Resume excerpt:
${ctx.resumeSnippet}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.7,
    max_tokens: 2500,
  });

  const raw = response.choices[0]?.message?.content?.trim() || '';
  try {
    const projects = parseProjects(raw);
    return linkedinVisibilityStore.saveMany(userId, projects.slice(0, count));
  } catch {
    const demo = buildDemoProjects(ctx, count);
    demo.forEach((p) => { p.parseError = true; });
    return linkedinVisibilityStore.saveMany(userId, demo);
  }
}

function listPosts(userId) {
  return linkedinVisibilityStore.list(userId);
}

function markPosted(userId, id) {
  const row = linkedinVisibilityStore.update(userId, id, {
    status: 'posted',
    postedAt: new Date().toISOString(),
  });
  if (!row) {
    const err = new Error('Post not found');
    err.status = 404;
    throw err;
  }
  return row;
}

function deletePost(userId, id) {
  linkedinVisibilityStore.remove(userId, id);
}

module.exports = {
  generateProjects,
  listPosts,
  markPosted,
  deletePost,
};
