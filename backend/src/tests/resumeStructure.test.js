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
});
