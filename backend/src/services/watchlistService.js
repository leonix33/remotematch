const Watchlist = require('../models/Watchlist');
const env = require('../config/env');
const jobService = require('./jobService');

function requireMongo() {
  if (!env.mongoUri) throw new Error('MongoDB is required');
}

async function list(userId) {
  requireMongo();
  const items = await Watchlist.find({ userId }).sort({ company: 1 }).lean();
  return items.map((w) => {
    const jobs = jobService.readJobsFromSqlite(5000).filter((j) =>
      j.company?.toLowerCase().includes(w.company.toLowerCase())
    );
    return { ...w, jobCount: jobs.length, topRole: jobs[0]?.title };
  });
}

async function add(userId, company, notes = '') {
  requireMongo();
  return Watchlist.findOneAndUpdate(
    { userId, company: company.trim() },
    { userId, company: company.trim(), notes },
    { upsert: true, new: true }
  );
}

async function remove(userId, id) {
  requireMongo();
  await Watchlist.findOneAndDelete({ _id: id, userId });
}

module.exports = { list, add, remove };
