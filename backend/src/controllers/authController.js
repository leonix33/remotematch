const { z } = require('zod');
const authService = require('../services/authService');
const userDataService = require('../services/userDataService');
const env = require('../config/env');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

async function login(req, res, next) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.email, body.password);
    res.json({
      accessToken: result.accessToken,
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.sub);
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const body = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user.sub, body.currentPassword, body.newPassword);
    res.json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
}

async function extensionToken(req, res, next) {
  try {
    const user = await authService.getMe(req.user.sub);
    const token = authService.signExtensionToken(user);
    res.json({
      apiUrl: env.appUrl,
      accessToken: token,
      expiresIn: '90 days',
      instructions: 'Paste both values into the Chrome extension Settings page.',
    });
  } catch (err) {
    next(err);
  }
}

async function exportData(req, res, next) {
  try {
    const data = await userDataService.exportUserData(req.user.sub);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="remotelymatch-data-export.json"');
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function deleteAccount(req, res, next) {
  try {
    const body = z.object({ password: z.string().min(8) }).parse(req.body);
    const result = await userDataService.deleteUserAccount(req.user.sub, body.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me, changePassword, extensionToken, exportData, deleteAccount };
