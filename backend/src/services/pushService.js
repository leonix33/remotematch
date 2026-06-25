const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const env = require('../config/env');
const localPushStore = require('./localPushStore');

function configured() {
  return Boolean(env.vapidPublicKey && env.vapidPrivateKey);
}

function initVapid() {
  if (!configured()) return false;
  webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
  return true;
}

async function subscribe(userId, subscription) {
  initVapid();
  if (!env.mongoUri) {
    return localPushStore.subscribe(userId, subscription);
  }
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
  if (!env.mongoUri) {
    localPushStore.unsubscribe(userId, endpoint);
    return;
  }
  await PushSubscription.deleteOne({ userId, endpoint });
}

async function listSubscriptions(userId) {
  if (!env.mongoUri) {
    return localPushStore.listForUser(userId);
  }
  return PushSubscription.find({ userId }).lean();
}

async function sendToUser(userId, { title, body, url, tag }) {
  if (!configured() || !initVapid()) {
    return { sent: false, reason: 'push_not_configured' };
  }

  const subs = await listSubscriptions(userId);
  if (!subs.length) {
    return { sent: false, reason: 'no_subscriptions' };
  }

  const payload = JSON.stringify({
    title: title || 'RemoteMatch',
    body: body || '',
    url: url || '/',
    tag: tag || url,
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
        .catch(async (err) => {
          if (err.statusCode === 410) {
            if (env.mongoUri) {
              await PushSubscription.deleteOne({ endpoint: sub.endpoint });
            } else {
              localPushStore.unsubscribe(userId, sub.endpoint);
            }
          }
          throw err;
        })
    )
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return { sent: sent > 0, count: sent, total: subs.length };
}

function getPublicKey() {
  return env.vapidPublicKey || '';
}

module.exports = { subscribe, unsubscribe, sendToUser, getPublicKey, configured };
