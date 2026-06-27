const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseResumeStructure,
  reassembleResume,
  describeStructureForPrompt,
} = require('../services/resumeStructureService');

describe('resumeStructureService', () => {
  const sample = `LEONIX ASONGWE
leonix@email.com | (555) 123-4567

PROFESSIONAL SUMMARY
Senior platform engineer with Azure and Databricks experience.

EXPERIENCE
Senior Platform Engineer | Acme Corp
Jan 2020 – Present
- Built CI/CD pipelines on Azure DevOps
- Managed Databricks workspaces

EDUCATION
B.S. Computer Science — State University, 2018

CERTIFICATIONS
AWS Solutions Architect Associate
Azure Administrator Associate
Databricks Certified Data Engineer`;

  it('parses sections in original order', () => {
    const structure = parseResumeStructure(sample);
    assert.deepEqual(
      structure.sections.map((s) => s.key),
      ['summary', 'experience', 'education', 'certifications']
    );
    assert.equal(structure.sections[0].heading, 'PROFESSIONAL SUMMARY');
    assert.equal(structure.sections[3].immutable, true);
    assert.ok(structure.headerLines[0].includes('LEONIX'));
  });

  it('reassembles with exact headings', () => {
    const structure = parseResumeStructure(sample);
    const text = reassembleResume(structure, [
      { heading: 'PROFESSIONAL SUMMARY', content: 'Tailored summary for the role.' },
      {
        heading: 'EXPERIENCE',
        content: 'Senior Platform Engineer | Acme Corp\nJan 2020 – Present\n- Tailored bullet',
      },
      { heading: 'EDUCATION', content: structure.sections.find((s) => s.key === 'education').content },
      { heading: 'CERTIFICATIONS', content: structure.sections.find((s) => s.key === 'certifications').content },
    ]);
    assert.ok(text.includes('PROFESSIONAL SUMMARY'));
    assert.ok(text.includes('CERTIFICATIONS'));
    assert.ok(text.includes('AWS Solutions Architect Associate'));
    assert.ok(text.indexOf('EXPERIENCE') < text.indexOf('EDUCATION'));
  });

  it('describes immutable sections for the prompt', () => {
    const structure = parseResumeStructure(sample);
    const guide = describeStructureForPrompt(structure);
    assert.match(guide, /COPY VERBATIM/);
    assert.match(guide, /EXPERIENCE/);
  });

  it('merges false TOOLS breaks back into experience for tailoring', () => {
    const { prepareResumeTextForParsing } = require('../services/resumeRepairService');
    const broken = `PROFESSIONAL EXPERIENCE
DevOps Engineer Aug 2020 Jan 2022 Wimora Technology
Implemented DevSecOps pipelines with SAST, DAST, dependency scanning, and container image scanning, as measured by security control coverage established across all deployment workflows, by integrating security scanning
TOOLS
into CI/CD pipelines as mandatory gates, ensuring vulnerabilities were caught before production deployment.
Cloud Engineer / DevOps Dec 2016 Jul 2020 PRIMUS Global Services
Built and operated multi-account AWS environments using EC2, VPC, IAM, S3, RDS, Lambda, and CloudFormation.`;

    const prepared = prepareResumeTextForParsing(broken);
    assert.ok(!/\nTOOLS\n/i.test(prepared), 'false TOOLS header should be removed');
    assert.ok(prepared.includes('integrating security scanning into CI/CD pipelines'));
    assert.ok(prepared.includes('PRIMUS Global Services'));

    const structure = parseResumeStructure(broken);
    const keys = structure.sections.map((s) => s.key);
    assert.ok(!keys.includes('tools'), `unexpected tools section: ${keys.join(', ')}`);
    const experience = structure.sections.find((s) => s.key === 'experience');
    assert.ok(experience, 'expected experience section');
    assert.ok(experience.content.includes('into CI/CD pipelines'));
    assert.ok(experience.content.includes('PRIMUS Global Services'));
  });
});
