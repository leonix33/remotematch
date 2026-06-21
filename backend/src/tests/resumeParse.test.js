const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  extractSkillsFromText,
  computeResumeScore,
  mergeSkillLists,
} = require('../services/resumeParseService');

describe('resumeParseService', () => {
  it('extracts common platform engineering skills from resume text', () => {
    const text = `
      Platform Engineer with Kubernetes, Terraform, AWS, Azure, Docker, and Python.
      Built CI/CD pipelines and managed EKS clusters. Experience with Databricks and Prometheus.
    `;
    const { mustHave, niceToHave } = extractSkillsFromText(text);
    assert.ok(mustHave.includes('kubernetes'));
    assert.ok(mustHave.includes('terraform'));
    assert.ok(niceToHave.includes('databricks'));
    assert.ok(niceToHave.includes('prometheus'));
  });

  it('scores richer resumes higher', () => {
    const sparse = computeResumeScore({
      resumeText: 'Short resume',
      mustHaveSkills: ['aws'],
      targetTitles: ['devops engineer'],
    });
    const rich = computeResumeScore({
      resumeText: 'x'.repeat(800),
      mustHaveSkills: ['aws', 'kubernetes', 'terraform', 'python'],
      niceToHaveSkills: ['databricks', 'prometheus'],
      headline: 'Platform Engineer',
      targetTitles: ['platform engineer'],
      extractedSkills: ['aws', 'kubernetes', 'terraform', 'python', 'docker', 'linux'],
    });
    assert.ok(rich > sparse);
    assert.ok(rich >= 70);
  });

  it('merges skill lists without duplicates', () => {
    const merged = mergeSkillLists('kubernetes\naws', ['AWS', 'terraform']);
    assert.equal(merged, 'kubernetes\naws\nterraform');
  });
});
