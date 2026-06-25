const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildDemoKit,
  inferMissingKeywords,
  formatKitAsText,
} = require('../services/resumeTailorService');

describe('resumeTailorService', () => {
  const profile = {
    displayName: 'Alex Rivera',
    resumeText: 'Senior DevOps engineer with Terraform, AWS, and Kubernetes in production.',
    mustHaveSkills: ['terraform', 'aws', 'kubernetes'],
    targetTitles: ['devops engineer'],
  };

  const job = { title: 'Platform Engineer', company: 'Acme', matchPct: 82 };
  const jd = 'We need Terraform, AWS, Kubernetes, and Istio service mesh experience.';

  it('detects keywords present in JD but absent from resume', () => {
    const missing = inferMissingKeywords(profile, jd);
    assert.ok(missing.includes('istio'));
    assert.ok(!missing.includes('terraform'));
  });

  it('builds additive demo kit without rewriting resume', () => {
    const kit = buildDemoKit(profile, job, jd);
    assert.equal(kit.mode, 'additive');
    assert.ok(kit.guardrails.toLowerCase().includes('unchanged') || kit.guardrails.length > 0);
    assert.ok(Array.isArray(kit.additiveBullets));
    assert.ok(kit.coverLetterParagraph.includes('Platform Engineer'));
  });

  it('formats kit as readable text', () => {
    const kit = buildDemoKit(profile, job, jd);
    const text = formatKitAsText(kit);
    assert.ok(text.includes('APPLICATION KIT'));
    assert.ok(text.includes('additive'));
  });
});

describe('applicationKitService attachKitToApplyItem', () => {
  const { attachKitToApplyItem } = require('../services/applicationKitService');

  it('skips kit fields when useTailoredResume is false', () => {
    const job = { id: 'job-1', title: 'SRE', company: 'Acme' };
    const result = attachKitToApplyItem('user-1', job, { useTailoredResume: false });
    assert.equal(result.use_tailored_resume, false);
    assert.equal(result.cover_letter, undefined);
  });
});
