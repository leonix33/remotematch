const notificationService = require('../services/notificationService');

async function list(req, res, next) {
  try {
    await notificationService.scanAndNotify(req.user.sub);
    const items = await notificationService.list(req.user.sub);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function unread(req, res, next) {
  try {
    const count = await notificationService.unreadCount(req.user.sub);
    res.json({ count });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    await notificationService.markRead(req.user.sub, req.params.id);
    res.json({ message: 'OK' });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await notificationService.markAllRead(req.user.sub);
    res.json({ message: 'OK' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, unread, markRead, markAllRead };
