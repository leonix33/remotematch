const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeJob, extractSkills } = require('../services/jobs/jobNormalizer');
const { deduplicateJobs, jaccardSimilarity } = require('../services/jobs/jobDedupService');
const {
  freshnessScore,
  freshnessLabel,
  qualityScore,
  enrichJobScores,
} = require('../services/jobs/jobQualityService');

describe('jobNormalizer', () => {
  it('normalizes raw jobs into canonical schema', () => {
    const job = normalizeJob({
      id: 'remoteok-1',
      title: 'Platform Engineer',
      company: 'Acme',
      location: 'Remote',
      applyUrl: 'https://example.com/jobs/1',
      source: 'RemoteOK',
      description: '<p>Kubernetes and Terraform</p>',
      postedAt: new Date().toISOString(),
    });

    assert.equal(job.id, 'remoteok-1');
    assert.equal(job.jobId, 'remoteok-1');
    assert.equal(job.remoteType, 'remote');
    assert.ok(job.skills.includes('kubernetes'));
    assert.equal(job.applyUrl, 'https://example.com/jobs/1');
  });

  it('extracts skills from description text', () => {
    const skills = extractSkills('Senior DevOps with AWS, Python, and CI/CD experience');
    assert.ok(skills.includes('aws'));
    assert.ok(skills.includes('python'));
  });
});

describe('jobDedupService', () => {
  it('deduplicates by applyUrl', () => {
    const jobs = [
      { title: 'DevOps Engineer', company: 'Acme', applyUrl: 'https://x.com/1', qualityScore: 50 },
      { title: 'DevOps Eng', company: 'Acme', applyUrl: 'https://x.com/1', qualityScore: 80 },
    ];
    const out = deduplicateJobs(jobs);
    assert.equal(out.length, 1);
    assert.equal(out[0].qualityScore, 80);
  });

  it('fuzzy dedupes similar titles at same company', () => {
    const jobs = [
      { title: 'Senior Platform Engineer', company: 'Datadog', applyUrl: 'https://a.com/1', qualityScore: 60 },
      { title: 'Platform Engineer Senior', company: 'Datadog', applyUrl: 'https://b.com/2', qualityScore: 70 },
    ];
    const out = deduplicateJobs(jobs);
    assert.equal(out.length, 1);
  });

  it('computes jaccard similarity', () => {
    const sim = jaccardSimilarity('platform engineer', 'engineer platform');
    assert.ok(sim >= 0.8);
  });
});

describe('jobQualityService', () => {
  it('scores freshness by posting age', () => {
    const recent = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const week = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const month = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();

    assert.equal(freshnessScore(recent), 100);
    assert.equal(freshnessLabel(recent), 'posted_24h');
    assert.equal(freshnessScore(week), 75);
    assert.equal(freshnessLabel(week), 'posted_7d');
    assert.equal(freshnessScore(month), 50);
    assert.equal(freshnessLabel(month), 'posted_30d');
  });

  it('scores higher quality for rich postings', () => {
    const rich = qualityScore({
      description: 'x'.repeat(1200),
      salaryMin: 150000,
      skills: ['kubernetes', 'terraform', 'aws', 'python'],
      remoteType: 'remote',
      applyUrl: 'https://boards.greenhouse.io/acme/jobs/1',
      atsType: 'greenhouse',
      postedAt: new Date().toISOString(),
    });
    const sparse = qualityScore({ title: 'Job', company: 'Co' });
    assert.ok(rich > sparse);
    assert.ok(rich >= 70);
  });

  it('enriches jobs with freshness and quality fields', () => {
    const enriched = enrichJobScores(
      normalizeJob({
        id: 'test-1',
        title: 'SRE',
        company: 'Co',
        applyUrl: 'https://example.com',
        source: 'Test',
        description: 'kubernetes terraform aws',
        postedAt: new Date().toISOString(),
      })
    );
    assert.ok(enriched.qualityScore > 0);
    assert.ok(enriched.freshnessScore > 0);
    assert.ok(enriched.freshnessLabel);
  });
});
