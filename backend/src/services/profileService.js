const Profile = require('../models/Profile');
const env = require('../config/env');

function isComplete(profile) {
  return Boolean(
    profile?.onboardingComplete &&
    profile?.displayName?.trim() &&
    profile?.targetTitles?.length &&
    profile?.mustHaveSkills?.length
  );
}

function toResponse(profile) {
  const doc = profile.toObject ? profile.toObject() : profile;
  return {
    ...doc,
    complete: isComplete(doc),
  };
}

async function getOrCreate(userId) {
  if (!env.mongoUri) {
    return {
      userId,
      displayName: '',
      targetTitles: [],
      mustHaveSkills: [],
      niceToHaveSkills: [],
      targetCompanies: [],
      onboardingComplete: false,
      complete: false,
      mongoRequired: true,
    };
  }
  let profile = await Profile.findOne({ userId });
  if (!profile) {
    profile = await Profile.create({ userId });
  }
  return toResponse(profile);
}

async function update(userId, data) {
  if (!env.mongoUri) {
    throw new Error('MongoDB is required to save profiles. Add MONGODB_URI in Render.');
  }
  const profile = await Profile.findOneAndUpdate(
    { userId },
    { $set: data },
    { new: true, upsert: true }
  );
  return toResponse(profile);
}

module.exports = { getOrCreate, update, isComplete, toResponse };
