const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email, name: user.name },
    env.jwtAccessSecret,
    { expiresIn: '15m' }
  );
}

async function login(email, password) {
  if (!env.mongoUri) {
    const ok =
      email.toLowerCase() === env.adminEmail.toLowerCase() &&
      password === env.adminPassword;
    if (!ok) throw new Error('Invalid login');
    const devUser = {
      _id: 'dev-admin',
      name: 'Admin',
      email: env.adminEmail,
      role: 'admin',
    };
    return { user: devUser, accessToken: signAccessToken(devUser) };
  }
  const user = await User.findOne({ email: email.toLowerCase(), active: true });
  if (!user) throw new Error('Invalid login');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error('Invalid login');
  return { user, accessToken: signAccessToken(user) };
}

async function getMe(userId) {
  if (!env.mongoUri && userId === 'dev-admin') {
    return { _id: 'dev-admin', name: 'Admin', email: env.adminEmail, role: 'admin' };
  }
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) throw new Error('User not found');
  return user;
}

module.exports = { login, signAccessToken, getMe };
