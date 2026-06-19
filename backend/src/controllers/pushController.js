const pushService = require('../services/pushService');

async function getVapidKey(req, res) {
  res.json({ publicKey: pushService.getPublicKey(), configured: pushService.configured() });
}

async function subscribe(req, res, next) {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint || !subscription?.keys) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }
    await pushService.subscribe(req.user.sub, subscription);
    res.json({ message: 'Subscribed to push notifications' });
  } catch (err) {
    next(err);
  }
}

async function unsubscribe(req, res, next) {
  try {
    await pushService.unsubscribe(req.user.sub, req.body.endpoint);
    res.json({ message: 'Unsubscribed' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getVapidKey, subscribe, unsubscribe };
