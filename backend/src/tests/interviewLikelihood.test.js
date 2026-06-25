const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { computeInterviewLikelihood } = require('../services/interviewLikelihoodService');
const { buildDemoKit, MIN_SUPPLEMENT_PAGES } = require('../services/resumeTailorService');

describe('interviewLikelihoodService', () => {
  const profile = {
    targetTitles: ['devops engineer'],
    mustHaveSkills: ['terraform', 'kubernetes', 'aws'],
    resumeText: 'DevOps engineer with terraform kubernetes aws experience',
  };

  it('scores direct ATS fresh remote roles higher than stale unknown boards', () => {
    const strong = computeInterviewLikelihood(
      {
        title: 'Senior DevOps Engineer',
        company: 'Acme',
        location: 'Remote US',
        source: 'Greenhouse',
        atsType: 'greenhouse',
        personalMatchPct: 82,
        freshnessScore: 100,
        firstSeen: new Date().toISOString(),
      },
      profile,
      { sourceReplyRates: { greenhouse: 0.12 }, sampleSize: 10 },
      { acme: 3 }
    );

    const weak = computeInterviewLikelihood(
      {
        title: 'IT Support',
        company: 'Other',
        location: 'On-site NYC',
        source: 'Dice',
        atsType: 'unknown',
        personalMatchPct: 45,
        freshnessScore: 25,
      },
      profile,
      { sourceReplyRates: {}, sampleSize: 0 },
      {}
    );

    assert.ok(strong.interviewLikelihoodPct > weak.interviewLikelihoodPct);
    assert.ok(strong.interviewLikelihoodPct >= 25);
    assert.ok(Array.isArray(strong.likelihoodFactors));
  });
});

describe('resumeTailorService 3-page supplement', () => {
  it('builds minimum 3 supplement pages in demo mode', () => {
    const kit = buildDemoKit(
      { displayName: 'Alex', mustHaveSkills: ['terraform'] },
      { title: 'Platform Engineer', company: 'DataCo' },
      'We need terraform kubernetes aws observability on-call experience for US remote role.'
    );
    assert.ok(kit.supplementPages.length >= MIN_SUPPLEMENT_PAGES);
    assert.ok((kit.fullSupplementText || '').length > 500);
  });
});
