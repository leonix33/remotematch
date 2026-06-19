const Conference = require('../models/Conference');
const env = require('../config/env');

const SEED = [
  { name: 'DevOpsDays Austin', format: 'in_person', city: 'Austin', state: 'TX', location: 'Austin Convention Center', tags: ['devops', 'sre'], recurring: 'annual', featured: true, url: 'https://devopsdays.org' },
  { name: 'KubeCon + CloudNativeCon North America', format: 'hybrid', city: 'Salt Lake City', state: 'UT', location: 'Salt Palace', tags: ['kubernetes', 'cloud'], recurring: 'annual', featured: true, url: 'https://events.linuxfoundation.org/kubecon-cloudnativecon-north-america' },
  { name: 'SREcon Americas', format: 'hybrid', city: 'San Francisco', state: 'CA', location: 'SF Bay Area', tags: ['sre', 'reliability'], recurring: 'annual', featured: true, url: 'https://www.usenix.org/conference/srecon' },
  { name: 'AWS re:Invent', format: 'in_person', city: 'Las Vegas', state: 'NV', location: 'Las Vegas', tags: ['aws', 'cloud'], recurring: 'annual', featured: true, url: 'https://reinvent.awsevents.com' },
  { name: 'GopherCon', format: 'in_person', city: 'Chicago', state: 'IL', location: 'Chicago', tags: ['golang', 'backend'], recurring: 'annual', url: 'https://www.gophercon.com' },
  { name: 'PyData Global', format: 'remote', location: 'Online', tags: ['python', 'data'], recurring: 'annual', url: 'https://pydata.org' },
  { name: 'Remote Job Search Weekly', format: 'remote', location: 'Zoom', tags: ['career', 'remote'], recurring: 'weekly', featured: true, description: 'Weekly virtual meetup for remote job seekers — resume reviews, networking breakouts.' },
  { name: 'Platform Engineering Meetup', format: 'remote', location: 'Online', tags: ['platform', 'devops'], recurring: 'weekly', description: 'Community talks on internal developer platforms and tooling.' },
  { name: 'Tech Career Accelerator', format: 'remote', location: 'Online', tags: ['career', 'interview'], recurring: 'weekly', description: 'Mock interviews, salary negotiation workshops, and recruiter Q&A.' },
  { name: 'DataEng Weekly Live', format: 'remote', location: 'Online', tags: ['data', 'engineering'], recurring: 'weekly' },
  { name: 'Black Hills InfoSec', format: 'in_person', city: 'Spearfish', state: 'SD', location: 'Spearfish', tags: ['security'], recurring: 'annual' },
  { name: 'Monitorama', format: 'in_person', city: 'Portland', state: 'OR', location: 'Portland', tags: ['observability', 'sre'], recurring: 'annual' },
  { name: 'DevNexus', format: 'in_person', city: 'Atlanta', state: 'GA', location: 'Atlanta', tags: ['java', 'devops'], recurring: 'annual' },
  { name: 'All Things Open', format: 'hybrid', city: 'Raleigh', state: 'NC', location: 'Raleigh Convention Center', tags: ['open source'], recurring: 'annual' },
  { name: 'LeadDev New York', format: 'in_person', city: 'New York', state: 'NY', location: 'NYC', tags: ['leadership', 'engineering'], recurring: 'annual' },
];

function nextWeekly(dayOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + ((4 - d.getDay() + 7) % 7) + dayOffset);
  d.setHours(17, 0, 0, 0);
  return d;
}

function nextAnnual(month, day) {
  const d = new Date();
  d.setMonth(month - 1, day);
  if (d < new Date()) d.setFullYear(d.getFullYear() + 1);
  return d;
}

async function ensureSeed() {
  if (!env.mongoUri) return;
  const count = await Conference.countDocuments();
  if (count > 0) return;

  const docs = SEED.map((s, i) => {
    let startDate;
    if (s.recurring === 'weekly') startDate = nextWeekly(i % 3);
    else if (s.name.includes('re:Invent')) startDate = nextAnnual(12, 2);
    else if (s.name.includes('KubeCon')) startDate = nextAnnual(11, 10);
    else startDate = nextAnnual(3 + (i % 9), 10 + (i % 15));

    const endDate = new Date(startDate);
    if (s.recurring === 'weekly') endDate.setHours(startDate.getHours() + 2);
    else endDate.setDate(endDate.getDate() + (s.recurring === 'annual' ? 3 : 1));

    return { ...s, startDate, endDate };
  });

  await Conference.insertMany(docs);
}

async function list({ format, weekOnly = false } = {}) {
  if (!env.mongoUri) {
    return SEED.map((s, i) => ({
      ...s,
      startDate: nextWeekly(i % 2),
      id: `seed-${i}`,
    }));
  }
  await ensureSeed();
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const q = { startDate: { $gte: now } };
  if (weekOnly) q.startDate.$lte = weekEnd;
  if (format) q.format = format;

  let items = await Conference.find(q).sort({ startDate: 1 }).limit(50).lean();

  const weekly = await Conference.find({ recurring: 'weekly' }).lean();
  for (const w of weekly) {
    const next = nextWeekly();
    items.push({ ...w, startDate: next, endDate: new Date(next.getTime() + 7200000) });
  }

  items.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  return items;
}

module.exports = { list, ensureSeed };
