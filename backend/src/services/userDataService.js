const env = require('../config/env');
const User = require('../models/User');
const Profile = require('../models/Profile');
const JobApproval = require('../models/JobApproval');
const CalendarEvent = require('../models/CalendarEvent');
const profileFileService = require('./profileFileService');
const localApprovalService = require('./localApprovalService');
const profileService = require('./profileService');

function requireMongo() {
  if (!env.mongoUri) {
    const err = new Error('Account export and deletion require MongoDB on the server');
    err.status = 503;
    throw err;
  }
}

async function exportUserData(userId) {
  if (!env.mongoUri) {
    const profile = profileFileService.get(userId);
    const approvals = Object.values(localApprovalService.listForUser(userId) || {});
    return {
      exportedAt: new Date().toISOString(),
      profile: profileService.toResponse(profile),
      approvals,
      calendarEvents: [],
      note: 'Limited export in local dev mode (no MongoDB).',
    };
  }

  requireMongo();
  const [user, profile, approvals, calendarEvents] = await Promise.all([
    User.findById(userId).select('-passwordHash').lean(),
    Profile.findOne({ userId }).lean(),
    JobApproval.find({ userId }).lean(),
    CalendarEvent.find({ userId }).lean(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    user,
    profile,
    approvals,
    calendarEvents,
  };
}

async function deleteUserAccount(userId, password) {
  if (!env.mongoUri) {
    const err = new Error('Account deletion requires MongoDB on the server');
    err.status = 503;
    throw err;
  }

  requireMongo();
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const bcrypt = require('bcryptjs');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error('Password is incorrect');
    err.status = 401;
    throw err;
  }

  await Promise.all([
    Profile.deleteOne({ userId }),
    JobApproval.deleteMany({ userId }),
    CalendarEvent.deleteMany({ userId }),
  ]);

  user.active = false;
  user.email = `deleted+${user._id}@deleted.local`;
  user.name = 'Deleted user';
  await user.save();

  return { message: 'Account deleted. Your profile, queue, and calendar data were removed.' };
}

module.exports = { exportUserData, deleteUserAccount };
