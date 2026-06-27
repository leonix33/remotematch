export function formatApplyEmailNotice(emailNotification) {
  if (!emailNotification) return '';
  if (emailNotification.sent) {
    return `Summary email sent to ${emailNotification.to}. Check your inbox and spam folder.`;
  }
  if (emailNotification.reason) {
    return `No summary email sent — ${emailNotification.reason}`;
  }
  return '';
}
