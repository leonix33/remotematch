const crypto = require('crypto');
const ReferralThread = require('../models/ReferralThread');
const IntroOffer = require('../models/IntroOffer');
const User = require('../models/User');
const env = require('../config/env');
const notificationService = require('./notificationService');
const chatService = require('./chatService');

function requireMongo() {
  if (!env.mongoUri) throw new Error('MongoDB is required');
}

async function list(company = '') {
  requireMongo();
  const q = company ? { company: new RegExp(company, 'i') } : {};
  const threads = await ReferralThread.find(q).sort({ updatedAt: -1 }).limit(50).lean();
  const threadIds = threads.map((t) => t._id);
  const offers = await IntroOffer.find({ threadId: { $in: threadIds } }).lean();
  const byThread = new Map();
  for (const o of offers) {
    if (!byThread.has(o.threadId.toString())) byThread.set(o.threadId.toString(), []);
    byThread.get(o.threadId.toString()).push(o);
  }
  return threads.map((t) => ({ ...t, introOffers: byThread.get(t._id.toString()) || [] }));
}

async function create(userId, { company, title, body }) {
  requireMongo();
  return ReferralThread.create({
    company,
    title,
    body,
    createdBy: userId,
    replies: [],
  });
}

async function reply(userId, threadId, content, canIntro = false) {
  requireMongo();
  const user = await User.findById(userId);
  const thread = await ReferralThread.findById(threadId);
  if (!thread) throw new Error('Thread not found');
  thread.replies.push({ userId, userName: user?.name, content, canIntro: Boolean(canIntro) });
  await thread.save();
  if (thread.createdBy.toString() !== userId.toString()) {
    await notificationService.create(thread.createdBy, {
      type: 'system',
      title: `Reply on ${thread.company} referral thread`,
      body: `${user?.name}: ${content.slice(0, 80)}`,
      link: '/social',
    });
  }
  return thread;
}

async function offerIntro(userId, threadId, message = '') {
  requireMongo();
  const user = await User.findById(userId);
  const thread = await ReferralThread.findById(threadId);
  if (!thread) throw new Error('Thread not found');
  if (thread.createdBy.toString() === userId.toString()) {
    throw new Error('Cannot offer intro on your own thread');
  }

  const existing = await IntroOffer.findOne({ threadId, fromUserId: userId, status: 'pending' });
  if (existing) throw new Error('You already have a pending intro offer');

  const offer = await IntroOffer.create({
    threadId,
    company: thread.company,
    fromUserId: userId,
    fromUserName: user?.name,
    toUserId: thread.createdBy,
    message: message.trim(),
    status: 'pending',
  });

  await notificationService.create(thread.createdBy, {
    type: 'system',
    title: `Intro offer for ${thread.company}`,
    body: `${user?.name} can introduce you. Review in Referral marketplace.`,
    link: '/social',
    meta: { introOfferId: offer._id },
  });

  return offer;
}

async function listIntroOffers(userId) {
  requireMongo();
  return IntroOffer.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
}

async function acceptIntro(userId, offerId) {
  requireMongo();
  const offer = await IntroOffer.findById(offerId);
  if (!offer || offer.toUserId.toString() !== userId.toString()) {
    throw new Error('Intro offer not found');
  }
  if (offer.status !== 'pending') throw new Error('Offer already handled');

  offer.status = 'connected';
  await offer.save();

  const intro = offer.message || `Happy to intro you at ${offer.company}`;
  const dm = await chatService.ensureDirectDm(offer.fromUserId, offer.toUserId, intro);

  await notificationService.create(offer.fromUserId, {
    type: 'system',
    title: `Intro accepted — ${offer.company}`,
    body: 'Open chat to coordinate the introduction.',
    link: `/chat?c=${dm.conversationId}`,
  });

  return { offer, conversationId: dm.conversationId };
}

async function declineIntro(userId, offerId) {
  requireMongo();
  const offer = await IntroOffer.findById(offerId);
  if (!offer || offer.toUserId.toString() !== userId.toString()) {
    throw new Error('Intro offer not found');
  }
  offer.status = 'declined';
  await offer.save();
  return offer;
}

module.exports = {
  list,
  create,
  reply,
  offerIntro,
  listIntroOffers,
  acceptIntro,
  declineIntro,
};
