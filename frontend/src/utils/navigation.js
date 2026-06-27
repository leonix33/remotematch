export const simpleNav = [
  { to: '/', label: 'Apply', icon: '▶', exact: true },
  { to: '/jobs', label: 'Jobs', icon: '◎' },
  { to: '/approvals', label: 'My Queue', icon: '✓' },
  { to: '/profile', label: 'Profile', icon: '◆' },
];

export const advancedNav = [
  { to: '/concierge', label: 'Ask AI', icon: '✦' },
  { to: '/tailored-resumes', label: 'Tailored resumes', icon: '📋' },
  { to: '/applications', label: 'Applications', icon: '▣' },
  { to: '/follow-ups', label: 'Follow-ups', icon: '↻' },
  { to: '/calendar', label: 'Calendar', icon: '📆' },
  { to: '/linkedin', label: 'LinkedIn', icon: 'in' },
  { to: '/chat', label: 'Chat', icon: '💬' },
  { to: '/outcomes', label: 'Outcomes', icon: '📈' },
  { to: '/resumes', label: 'Resume library', icon: '📄' },
  { to: '/generator', label: 'Cover letter', icon: '✍' },
  { to: '/interview', label: 'Interview prep', icon: '🎙' },
  { to: '/intelligence', label: 'AI intel', icon: '🧠' },
  { to: '/analytics', label: 'Analytics', icon: '◈' },
  { to: '/conferences', label: 'Conferences', icon: '🎤' },
  { to: '/social', label: 'Social', icon: '👥' },
  { to: '/swarm', label: 'Swarm', icon: '🐝' },
  { to: '/monitor', label: 'Monitor', icon: '◈', adminOnly: true },
  { to: '/agent', label: 'Run agent', icon: '⚡', adminOnly: true },
  { to: '/users', label: 'Team', icon: '◇', adminOnly: true },
];

export const mobileMoreSections = [
  {
    title: 'Apply workflow',
    items: advancedNav.filter((item) =>
      ['/concierge', '/tailored-resumes', '/applications', '/follow-ups', '/calendar', '/linkedin'].includes(item.to)
    ),
  },
  {
    title: 'Career tools',
    items: advancedNav.filter((item) =>
      ['/chat', '/outcomes', '/resumes', '/generator', '/interview', '/intelligence', '/analytics', '/conferences', '/social', '/swarm'].includes(item.to)
    ),
  },
  {
    title: 'Admin',
    adminOnly: true,
    items: advancedNav.filter((item) => item.adminOnly),
  },
];
