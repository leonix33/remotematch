const { z } = require('zod');
const podService = require('../services/podService');
const watchlistService = require('../services/watchlistService');
const referralService = require('../services/referralService');
const victoryService = require('../services/victoryService');
const User = require('../models/User');

async function listPods(req, res, next) {
  try {
    await podService.resetWeeksIfNeeded();
    const pods = await podService.listForUser(req.user.sub);
    res.json(pods);
  } catch (err) {
    next(err);
  }
}

async function createPod(req, res, next) {
  try {
    const body = z
      .object({ name: z.string().min(2), memberIds: z.array(z.string()), weeklyGoal: z.number().min(1).max(50).default(5) })
      .parse(req.body);
    const pod = await podService.create(req.user.sub, body.name, body.memberIds, body.weeklyGoal);
    res.status(201).json(pod);
  } catch (err) {
    next(err);
  }
}

async function listWatchlist(req, res, next) {
  try {
    res.json(await watchlistService.list(req.user.sub));
  } catch (err) {
    next(err);
  }
}

async function addWatchlist(req, res, next) {
  try {
    const body = z.object({ company: z.string().min(1), notes: z.string().optional() }).parse(req.body);
    res.status(201).json(await watchlistService.add(req.user.sub, body.company, body.notes));
  } catch (err) {
    next(err);
  }
}

async function removeWatchlist(req, res, next) {
  try {
    await watchlistService.remove(req.user.sub, req.params.id);
    res.json({ message: 'Removed' });
  } catch (err) {
    next(err);
  }
}

async function listReferrals(req, res, next) {
  try {
    res.json(await referralService.list(req.query.company));
  } catch (err) {
    next(err);
  }
}

async function createReferral(req, res, next) {
  try {
    const body = z.object({ company: z.string(), title: z.string(), body: z.string().optional() }).parse(req.body);
    res.status(201).json(await referralService.create(req.user.sub, body));
  } catch (err) {
    next(err);
  }
}

async function replyReferral(req, res, next) {
  try {
    const body = z.object({ content: z.string().min(1) }).parse(req.body);
    res.json(await referralService.reply(req.user.sub, req.params.id, body.content));
  } catch (err) {
    next(err);
  }
}

async function victoryFeed(req, res, next) {
  try {
    res.json(await victoryService.feed());
  } catch (err) {
    next(err);
  }
}

async function postVictory(req, res, next) {
  try {
    const body = z
      .object({
        company: z.string(),
        title: z.string().optional(),
        message: z.string().optional(),
        type: z.enum(['onsite', 'offer', 'applied', 'interview', 'other']).default('other'),
        public: z.boolean().default(true),
      })
      .parse(req.body);
    res.status(201).json(await victoryService.post(req.user.sub, body));
  } catch (err) {
    next(err);
  }
}

async function listMentors(req, res, next) {
  try {
    const mentors = await User.find({ $or: [{ isMentor: true }, { role: 'admin' }], active: true })
      .select('name email isMentor role')
      .lean();
    res.json(mentors);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPods,
  createPod,
  listWatchlist,
  addWatchlist,
  removeWatchlist,
  listReferrals,
  createReferral,
  replyReferral,
  victoryFeed,
  postVictory,
  listMentors,
};
