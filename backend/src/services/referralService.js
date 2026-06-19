const ReferralThread = require('../models/ReferralThread');
const User = require('../models/User');
const env = require('../config/env');

function requireMongo() {
  if (!env.mongoUri) throw new Error('MongoDB is required');
}

async function list(company = '') {
  requireMongo();
  const q = company ? { company: new RegExp(company, 'i') } : {};
  return ReferralThread.find(q).sort({ updatedAt: -1 }).limit(50).lean();
}

async function create(userId, { company, title, body }) {
  requireMongo();
  const user = await User.findById(userId);
  return ReferralThread.create({
    company,
    title,
    body,
    createdBy: userId,
    replies: [],
  });
}

async function reply(userId, threadId, content) {
  requireMongo();
  const user = await User.findById(userId);
  const thread = await ReferralThread.findById(threadId);
  if (!thread) throw new Error('Thread not found');
  thread.replies.push({ userId, userName: user?.name, content });
  await thread.save();
  return thread;
}

module.exports = { list, create, reply };
