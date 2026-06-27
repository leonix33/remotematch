import { mergeOrphanPrefixLines, tryParseJobBlock, splitParagraphToBullets } from './resumeExperienceParser';

const JOB_TITLE_DATE =
  /((?:Senior\s+|Lead\s+)?(?:Cloud\s+(?:Platform\s+)?|Platform\s+|DevOps\s+)?Engineer(?:\s*\/\s*DevOps)?|DevOps\s+Engineer|Cloud\s+Engineer(?:\s*\/\s*DevOps)?)\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})\s+(?:[–\-—]\s*|\s+)(Present|Current|Now|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})/gi;

const SKILL_CATEGORY_RE =
  /\b(Azure Platform|AWS Platform|Databricks & Data Platforms|Generative AI & MLOps|Containers & Kubernetes|IaC & Automation|CI\/CD & DevSecOps|Security & Compliance|Observability & Reliability):\s*/gi;

export function splitExperienceBlob(text) {
  const t = String(text || '').trim().replace(/\s+/g, ' ');
  if (!t || t.length < 80) return null;

  const matches = [...t.matchAll(JOB_TITLE_DATE)];
  if (matches.length < 2) return null;

  const chunks = [];
  for (let i = 0; i < matches.length; i += 1) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : t.length;
    chunks.push(t.slice(start, end).trim());
  }
  return chunks.filter(Boolean);
}

export function parseSkillsSectionLines(contentLines) {
  const text = contentLines.map((l) => String(l).trim()).filter(Boolean).join(' ');
  if (!text) return [];

  const rows = [];
  const re = new RegExp(SKILL_CATEGORY_RE.source, 'gi');
  const hits = [...text.matchAll(re)];

  if (hits.length >= 2) {
    for (let i = 0; i < hits.length; i += 1) {
      const label = hits[i][1].trim();
      const start = hits[i].index + hits[i][0].length;
      const end = i + 1 < hits.length ? hits[i + 1].index : text.length;
      const items = text.slice(start, end).trim().replace(/\s+/g, ' ');
      if (items) rows.push({ type: 'skill-category', label, items });
    }
    return rows;
  }

  if (text.includes('|') && text.length < 400) {
    return [{ type: 'pipe-line', text }];
  }

  return [{ type: 'text', text }];
}

export function parseEducationSectionLines(contentLines) {
  const merged = contentLines.map((l) => String(l).trim()).filter(Boolean);
  const rows = [];

  for (let i = 0; i < merged.length; i += 1) {
    const t = merged[i];
    const next = merged[i + 1];
    if (
      next &&
      /University|College|Institute|School|Academy|WGU|Yaounde/i.test(next) &&
      !/University|College|Institute/i.test(t)
    ) {
      rows.push({ type: 'education-block', degree: t, school: next });
      i += 1;
    } else {
      rows.push({ type: 'text', text: t });
    }
  }
  return rows;
}

export function parseCertificationsSectionLines(contentLines) {
  const lines = contentLines.map((l) => String(l).trim()).filter(Boolean);
  const rows = [];
  let currentGroup = null;

  for (const line of lines) {
    const groupMatch = line.match(/^(Azure|AWS|GCP|Databricks|Security|Lakehouse|Generative|Terraform|CKA)[^:]*(?:\(\d+\))?:\s*(.*)$/i);
    if (groupMatch) {
      if (currentGroup) rows.push(currentGroup);
      currentGroup = {
        type: 'cert-group',
        label: groupMatch[1] + (line.match(/\(\d+\)/) ? ` ${line.match(/\(\d+\)/)[0]}` : ''),
        items: groupMatch[2] ? [groupMatch[2].trim()] : [],
      };
      continue;
    }

    if (currentGroup && line.length < 80) {
      currentGroup.items.push(line);
    } else if (/Associate|Expert|Fundamentals|CKA|Security\+|Terraform/i.test(line)) {
      rows.push({ type: 'bullet', text: line });
    } else {
      rows.push({ type: 'text', text: line });
    }
  }
  if (currentGroup) rows.push(currentGroup);

  return rows.length ? rows : lines.map((t) => ({ type: 'bullet', text: t }));
}

export function parseExperienceSectionLines(contentLines) {
  const flat = contentLines.map((l) => String(l).trim()).filter(Boolean).join(' ');
  const multi = splitExperienceBlob(flat);
  const chunks = multi || mergeOrphanPrefixLines(contentLines.map((l) => String(l).trim()).filter(Boolean));

  const rows = [];
  for (const chunk of chunks) {
    const t = String(chunk || '').trim();
    if (!t) continue;

    const jobBlock = tryParseJobBlock(t);
    if (jobBlock) {
      rows.push(jobBlock);
      if (jobBlock.bodyText) {
        const bullets = splitParagraphToBullets(jobBlock.bodyText);
        if (bullets) rows.push(...bullets);
        else rows.push({ type: 'text', text: jobBlock.bodyText });
      }
      continue;
    }

    if (t.length > 100) {
      const bullets = splitParagraphToBullets(t);
      if (bullets) {
        rows.push(...bullets);
        continue;
      }
    }

    rows.push({ type: 'text', text: t });
  }

  return rows;
}
