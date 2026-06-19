const Watchlist = require('../models/Watchlist');
const User = require('../models/User');
const env = require('../config/env');
const jobService = require('./jobService');
const teamService = require('./teamService');

function requireMongo() {
  if (!env.mongoUri) throw new Error('MongoDB is required');
}

function enrich(w) {
  const jobs = jobService.readJobsFromSqlite(5000).filter((j) =>
    j.company?.toLowerCase().includes(w.company.toLowerCase())
  );
  return { ...w, jobCount: jobs.length, topRole: jobs[0]?.title };
}

async function list(userId) {
  requireMongo();
  const user = await User.findById(userId);
  const personal = await Watchlist.find({ userId }).sort({ company: 1 }).lean();
  let shared = [];
  if (user?.teamId) {
    shared = await Watchlist.find({
      teamId: user.teamId,
      shared: true,
      userId: { $ne: userId },
    })
      .sort({ company: 1 })
      .lean();
  }
  return [...personal.map(enrich), ...shared.map((w) => enrich({ ...w, isTeamShared: true }))];
}

async function add(userId, company, notes = '', shared = false) {
  requireMongo();
  const user = await User.findById(userId);
  const team = user?.teamId ? await teamService.getTeamForUser(userId) : null;
  const payload = {
    userId,
    company: company.trim(),
    notes,
    shared: Boolean(shared && team),
    teamId: shared && team ? team._id : undefined,
  };
  if (!payload.teamId) {
    payload.shared = false;
    delete payload.teamId;
  }
  return Watchlist.findOneAndUpdate(
    { userId, company: company.trim() },
    payload,
    { upsert: true, new: true }
  );
}

async function remove(userId, id) {
  requireMongo();
  await Watchlist.findOneAndDelete({ _id: id, userId });
}

module.exports = { list, add, remove };
