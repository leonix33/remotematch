const mongoose = require('mongoose');

const PLANS = {
  free: {
    agentRunsPerMonth: 5,
    aiCallsPerMonth: 30,
    approvalsPerMonth: 50,
    members: 3,
  },
  pro: {
    agentRunsPerMonth: 50,
    aiCallsPerMonth: 500,
    approvalsPerMonth: 500,
    members: 15,
  },
};

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: 'My Team' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    usageMonth: { type: String, default: '' },
    usage: {
      agentRuns: { type: Number, default: 0 },
      aiCalls: { type: Number, default: 0 },
      approvals: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

teamSchema.statics.planLimits = (plan) => PLANS[plan] || PLANS.free;

module.exports = mongoose.model('Team', teamSchema);
