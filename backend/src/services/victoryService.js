const Victory = require('../models/Victory');
const User = require('../models/User');
const env = require('../config/env');
const notificationService = require('./notificationService');

function requireMongo() {
  if (!env.mongoUri) throw new Error('MongoDB is required');
}

async function feed(limit = 30) {
  requireMongo();
  return Victory.find({ public: true }).sort({ createdAt: -1 }).limit(limit).lean();
}

async function post(userId, data) {
  requireMongo();
  const user = await User.findById(userId);
  const v = await Victory.create({
    userId,
    userName: user?.name,
    ...data,
  });
  return v;
}

module.exports = { feed, post };
