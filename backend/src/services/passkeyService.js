const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { isoUint8Array } = require('@simplewebauthn/server/helpers');
const Passkey = require('../models/Passkey');
const User = require('../models/User');
const env = require('../config/env');
const authService = require('./authService');
const { setChallenge, consumeChallenge } = require('./passkeyChallengeStore');

function resolveRpId(hostname) {
  const host = String(hostname || '').toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1') return 'localhost';

  const customDomain = String(env.customDomain || '').replace(/^www\./, '').toLowerCase();
  const withoutWww = host.replace(/^www\./, '');

  // Custom domain or its subdomains → use registrable domain (e.g. www.remotelymatch.app → remotelymatch.app)
  if (customDomain && (withoutWww === customDomain || withoutWww.endsWith(`.${customDomain}`))) {
    return customDomain;
  }

  // Other hosts (e.g. remotematch.onrender.com) must use their own hostname as rpId
  return withoutWww;
}

function getWebAuthnConfig(req) {
  const origin = req.headers.origin || env.appUrl.replace(/\/$/, '');
  let host = '';
  try {
    host = new URL(origin).hostname;
  } catch {
    host = env.customDomain || 'localhost';
  }
  return {
    rpName: env.appName,
    rpID: resolveRpId(host),
    origin: origin.replace(/\/$/, ''),
  };
}

function userIdBytes(userId) {
  return isoUint8Array.fromUTF8String(String(userId));
}

function registrationKey(userId) {
  return `reg:${userId}`;
}

function loginKey(email) {
  return `login:${email.trim().toLowerCase()}`;
}

async function listPasskeys(userId) {
  if (!env.mongoUri) return [];
  return Passkey.find({ userId }).select('deviceLabel createdAt lastUsedAt').lean();
}

async function hasPasskey(userId) {
  if (!env.mongoUri) return false;
  const count = await Passkey.countDocuments({ userId });
  return count > 0;
}

async function registrationOptions(req, user) {
  if (!env.mongoUri) throw new Error('Passkeys require MongoDB');
  const { rpName, rpID } = getWebAuthnConfig(req);
  const existing = await Passkey.find({ userId: user.sub }).lean();
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    userDisplayName: user.name || user.email,
    userID: userIdBytes(user.sub),
    attestationType: 'none',
    excludeCredentials: existing.map((pk) => ({
      id: pk.credentialId,
      transports: pk.transports,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
    },
  });
  setChallenge(registrationKey(user.sub), options.challenge);
  return options;
}

async function verifyRegistration(req, user, body, deviceLabel = '') {
  if (!env.mongoUri) throw new Error('Passkeys require MongoDB');
  const { rpID, origin } = getWebAuthnConfig(req);
  const expectedChallenge = consumeChallenge(registrationKey(user.sub));
  if (!expectedChallenge) {
    const err = new Error('Passkey setup expired. Try again.');
    err.status = 400;
    throw err;
  }
  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });
  if (!verification.verified || !verification.registrationInfo) {
    const err = new Error('Could not verify Face ID / passkey');
    err.status = 400;
    throw err;
  }
  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  await Passkey.create({
    userId: user.sub,
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey),
    counter: credential.counter,
    transports: body.response?.transports || [],
    deviceLabel: deviceLabel || (credentialDeviceType === 'singleDevice' ? 'This device' : 'Passkey'),
    lastUsedAt: new Date(),
  });
  return {
    message: 'Face ID sign-in enabled for this device',
    backedUp: credentialBackedUp,
  };
}

async function loginOptions(req, email) {
  if (!env.mongoUri) throw new Error('Passkeys require MongoDB');
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail, active: true });
  if (!user) {
    const err = new Error('No passkey found for this email');
    err.status = 404;
    throw err;
  }
  const passkeys = await Passkey.find({ userId: user._id }).lean();
  if (!passkeys.length) {
    const err = new Error('Face ID is not set up yet. Sign in with password first, then enable it in Profile.');
    err.status = 404;
    throw err;
  }
  const { rpID } = getWebAuthnConfig(req);
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: passkeys.map((pk) => ({
      id: pk.credentialId,
      transports: pk.transports,
    })),
    userVerification: 'required',
  });
  setChallenge(loginKey(normalizedEmail), options.challenge);
  return options;
}

async function verifyLogin(req, email, body) {
  if (!env.mongoUri) throw new Error('Passkeys require MongoDB');
  const normalizedEmail = email.trim().toLowerCase();
  const expectedChallenge = consumeChallenge(loginKey(normalizedEmail));
  if (!expectedChallenge) {
    const err = new Error('Sign-in expired. Try Face ID again.');
    err.status = 400;
    throw err;
  }
  const user = await User.findOne({ email: normalizedEmail, active: true });
  if (!user) throw new Error('Invalid login');

  const passkey = await Passkey.findOne({
    userId: user._id,
    credentialId: body.id,
  });
  if (!passkey) {
    const err = new Error('Passkey not recognized');
    err.status = 401;
    throw err;
  }

  const { rpID, origin } = getWebAuthnConfig(req);
  const verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: passkey.credentialId,
      publicKey: passkey.publicKey,
      counter: passkey.counter,
      transports: passkey.transports,
    },
    requireUserVerification: true,
  });

  if (!verification.verified) {
    const err = new Error('Face ID verification failed');
    err.status = 401;
    throw err;
  }

  const { newCounter } = verification.authenticationInfo;
  passkey.counter = newCounter;
  passkey.lastUsedAt = new Date();
  await passkey.save();

  return {
    user,
    accessToken: authService.signAccessToken(user),
  };
}

async function removePasskeys(userId) {
  if (!env.mongoUri) return { deleted: 0 };
  const result = await Passkey.deleteMany({ userId });
  return { deleted: result.deletedCount || 0 };
}

module.exports = {
  listPasskeys,
  hasPasskey,
  registrationOptions,
  verifyRegistration,
  loginOptions,
  verifyLogin,
  removePasskeys,
  getWebAuthnConfig,
};
