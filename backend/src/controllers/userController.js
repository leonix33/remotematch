const { z } = require('zod');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const teamService = require('../services/teamService');
const Team = require('../models/Team');
const emailService = require('../services/emailService');

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'user']).default('user'),
});

async function listUsers(req, res, next) {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const body = createUserSchema.parse(req.body);
    const exists = await User.findOne({ email: body.email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email already exists' });

    const adminTeam = await teamService.getTeamForUser(req.user.sub);
    if (adminTeam) {
      const limits = Team.planLimits(adminTeam.plan);
      const members = await User.countDocuments({ teamId: adminTeam._id, active: true });
      if (members >= limits.members) {
        return res.status(403).json({
          message: `Team member limit reached (${limits.members}). Upgrade to Pro for more seats.`,
        });
      }
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({
      name: body.name,
      email: body.email,
      role: body.role,
      passwordHash,
      teamId: adminTeam?._id,
    });

    let inviteEmailSent = false;
    try {
      const inviter = await User.findById(req.user.sub).select('name');
      const result = await emailService.notifyTeamInvite({
        to: user.email,
        name: user.name,
        email: user.email,
        password: body.password,
        invitedByName: inviter?.name,
      });
      inviteEmailSent = Boolean(result.sent);
    } catch (err) {
      console.warn('Invite email failed:', err.message);
    }

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      inviteEmailSent,
    });
  } catch (err) {
    next(err);
  }
}

const patchUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['admin', 'user']).optional(),
  active: z.boolean().optional(),
});

async function updateUser(req, res, next) {
  try {
    const body = patchUserSchema.parse(req.body);
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user.sub && body.active === false) {
      return res.status(400).json({ message: 'You cannot disable your own account' });
    }
    if (body.name) user.name = body.name;
    if (body.role) user.role = body.role;
    if (typeof body.active === 'boolean') user.active = body.active;
    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, active: user.active });
  } catch (err) {
    next(err);
  }
}

const resetPasswordSchema = z.object({
  password: z.string().min(8),
});

async function resetPassword(req, res, next) {
  try {
    const body = resetPasswordSchema.parse(req.body);
    const authService = require('../services/authService');
    const user = await User.findById(req.params.id).select('name email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const result = await authService.resetPassword(req.params.id, body.password);

    let resetEmailSent = false;
    try {
      const emailResult = await emailService.notifyPasswordReset({
        to: user.email,
        name: user.name,
        email: user.email,
        password: body.password,
      });
      resetEmailSent = Boolean(emailResult.sent);
    } catch (err) {
      console.warn('Password reset email failed:', err.message);
    }

    res.json({ message: 'Password reset', email: result.email, resetEmailSent });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, createUser, updateUser, resetPassword };
