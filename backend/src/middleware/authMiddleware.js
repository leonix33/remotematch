const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

async function resolveLegacyDevAdmin(user) {
  if (user.sub !== 'dev-admin' || !env.mongoUri) return user;
  const admin = await User.findOne({
    email: env.adminEmail?.toLowerCase(),
    role: 'admin',
    active: true,
  });
  if (!admin) {
    const err = new Error('Session expired. Please log out and log in again.');
    err.status = 401;
    throw err;
  }
  return { ...user, sub: admin._id.toString() };
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    req.user = await resolveLegacyDevAdmin(payload);
    next();
  } catch (err) {
    const status = err.status || 401;
    return res.status(status).json({ message: err.message || 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
}

module.exports = { requireAuth, requireAdmin };
