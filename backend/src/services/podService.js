const Pod = require('../models/Pod');
const env = require('../config/env');

function requireMongo() {
  if (!env.mongoUri) throw new Error('MongoDB is required');
}

function weekStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

async function create(creatorId, name, memberIds, weeklyGoal = 5) {
  requireMongo();
  const members = [{ userId: creatorId, weeklyGoal, appliesThisWeek: 0, streakWeeks: 0 }];
  for (const id of memberIds) {
    if (id.toString() !== creatorId.toString()) {
      members.push({ userId: id, weeklyGoal, appliesThisWeek: 0, streakWeeks: 0 });
    }
  }
  return Pod.create({ name, createdBy: creatorId, members, weekStart: weekStart() });
}

async function listForUser(userId) {
  requireMongo();
  return Pod.find({ 'members.userId': userId }).lean();
}

async function recordApply(userId) {
  requireMongo();
  const pods = await Pod.find({ 'members.userId': userId });
  for (const pod of pods) {
    const m = pod.members.find((x) => x.userId.toString() === userId.toString());
    if (m) {
      m.appliesThisWeek += 1;
      await pod.save();
    }
  }
}

async function resetWeeksIfNeeded() {
  requireMongo();
  const ws = weekStart();
  const pods = await Pod.find({ weekStart: { $lt: ws } });
  for (const pod of pods) {
    for (const m of pod.members) {
      if (m.appliesThisWeek >= m.weeklyGoal) m.streakWeeks += 1;
      else m.streakWeeks = 0;
      m.appliesThisWeek = 0;
    }
    pod.weekStart = ws;
    await pod.save();
  }
}

module.exports = { create, listForUser, recordApply, resetWeeksIfNeeded };
