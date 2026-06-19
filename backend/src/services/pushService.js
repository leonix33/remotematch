const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const env = require('../config/env');

function configured() {
  return Boolean(env.vapidPublicKey && env.vapidPrivateKey);
}

function initVapid() {
  if (!configured()) return false;
  webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
  return true;
}

async function subscribe(userId, subscription) {
  if (!env.mongoUri) throw new Error('MongoDB required');
  initVapid();
  return PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    {
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    },
    { upsert: true, new: true }
  );
}

async function unsubscribe(userId, endpoint) {
  await PushSubscription.deleteOne({ userId, endpoint });
}

async function sendToUser(userId, { title, body, url }) {
  if (!configured() || !initVapid()) return;
  const subs = await PushSubscription.find({ userId });
  const payload = JSON.stringify({ title, body, url: url || '/' });

  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payload
      ).catch(async (err) => {
        if (err.statusCode === 410) await PushSubscription.deleteOne({ _id: sub._id });
      })
    )
  );
}

function getPublicKey() {
  return env.vapidPublicKey || '';
}

module.exports = { subscribe, unsubscribe, sendToUser, getPublicKey, configured };
