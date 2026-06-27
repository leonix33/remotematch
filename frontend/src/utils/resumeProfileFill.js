/** Apply resume parse API result into onboarding/profile form fields (only fills empty fields). */
export function applyParseResultToForm(form, result, { authEmail = '', onlyIfEmpty = true } = {}) {
  if (!form || !result) return;

  const contact = result.extractedContact || {};
  const mustHave = result.extractedSkills?.mustHave || [];
  const niceToHave = result.extractedSkills?.niceToHave || [];
  const suggestedTitles = result.suggestedTitles || [];

  const set = (key, value) => {
    const v = String(value || '').trim();
    if (!v) return;
    if (onlyIfEmpty && form[key]?.trim?.()) return;
    form[key] = v;
  };

  if (result.resumeText) {
    form.resumeText = result.resumeText;
  }

  set('applicantName', contact.applicantName);
  set('displayName', contact.displayName || contact.applicantName);
  set('headline', result.suggestedHeadline);
  set('linkedin', contact.linkedin);
  set('github', contact.github);
  set('portfolio', contact.portfolio);

  if (mustHave.length && (!onlyIfEmpty || !form.mustHaveSkills?.trim())) {
    form.mustHaveSkills = mustHave.join('\n');
  }
  if (niceToHave.length && (!onlyIfEmpty || !form.niceToHaveSkills?.trim())) {
    form.niceToHaveSkills = niceToHave.join('\n');
  }
  if (suggestedTitles.length && (!onlyIfEmpty || !form.targetTitles?.trim())) {
    form.targetTitles = suggestedTitles.join('\n');
  }

  return {
    digestEmail: contact.digestEmail || authEmail || '',
    contactPhone: contact.contactPhone || '',
  };
}
