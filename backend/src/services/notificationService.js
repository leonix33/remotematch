const Notification = require('../models/Notification');
const env = require('../config/env');
const jobService = require('./jobService');
const profileService = require('./profileService');
const ChatRequest = require('../models/ChatRequest');
const approvalService = require('./approvalService');
const Watchlist = require('../models/Watchlist');

function requireMongo() {
  if (!env.mongoUri) throw new Error('MongoDB is required');
}

let emitToUser = () => {};

function setEmitter(fn) {
  emitToUser = fn;
}

async function create(userId, payload) {
  requireMongo();
  const n = await Notification.create({ userId, ...payload });
  emitToUser(userId.toString(), 'notification', n);
  return n;
}

async function list(userId, unreadOnly = false) {
  requireMongo();
  const q = { userId };
  if (unreadOnly) q.read = false;
  return Notification.find(q).sort({ createdAt: -1 }).limit(50).lean();
}

async function markRead(userId, id) {
  requireMongo();
  await Notification.findOneAndUpdate({ _id: id, userId }, { read: true });
}

async function markAllRead(userId) {
  requireMongo();
  await Notification.updateMany({ userId, read: false }, { read: true });
}

async function unreadCount(userId) {
  requireMongo();
  return Notification.countDocuments({ userId, read: false });
}

async function scanAndNotify(userId) {
  requireMongo();
  const profile = await profileService.getOrCreate(userId);
  const minHigh = 85;

  const jobs = jobService.readJobsFromSqlite(100).filter((j) => (j.matchPct || 0) >= minHigh);
  for (const job of jobs.slice(0, 3)) {
    const exists = await Notification.findOne({
      userId,
      type: 'high_match',
      'meta.jobId': job.jobId,
      createdAt: { $gte: new Date(Date.now() - 7 * 86400000) },
    });
    if (!exists) {
      await create(userId, {
        type: 'high_match',
        title: `${job.matchPct}% match: ${job.title}`,
        body: `${job.company} — review in Apply Queue`,
        link: '/approvals',
        meta: { jobId: job.jobId },
      });
    }
  }

  const pending = await ChatRequest.countDocuments({ toUserId: userId, status: 'pending' });
  if (pending > 0) {
    const exists = await Notification.findOne({
      userId,
      type: 'chat_request',
      read: false,
      createdAt: { $gte: new Date(Date.now() - 86400000) },
    });
    if (!exists) {
      await create(userId, {
        type: 'chat_request',
        title: `${pending} chat invite${pending > 1 ? 's' : ''} pending`,
        body: 'Accept to start messaging',
        link: '/chat',
      });
    }
  }

  try {
    const counts = await approvalService.counts(userId);
    if (counts.pending >= 5) {
      const exists = await Notification.findOne({
        userId,
        type: 'approval_queue',
        read: false,
        createdAt: { $gte: new Date(Date.now() - 86400000) },
      });
      if (!exists) {
        await create(userId, {
          type: 'approval_queue',
          title: `${counts.pending} jobs awaiting approval`,
          body: 'Your apply queue is filling up',
          link: '/approvals',
        });
      }
    }
  } catch {
    /* approvals may fail without mongo jobs */
  }

  const watchlists = await Watchlist.find({ userId, alertOnNewJobs: true });
  for (const w of watchlists) {
    const newJobs = jobService.readJobsFromSqlite(500).filter(
      (j) =>
        j.company?.toLowerCase().includes(w.company.toLowerCase()) &&
        j.firstSeen &&
        new Date(j.firstSeen) > new Date(Date.now() - 7 * 86400000)
    );
    if (newJobs.length) {
      await create(userId, {
        type: 'watchlist',
        title: `New ${w.company} roles`,
        body: `${newJobs.length} new listing(s)`,
        link: '/jobs',
        meta: { company: w.company },
      });
    }
  }
}

module.exports = { create, list, markRead, markAllRead, unreadCount, scanAndNotify, setEmitter };
