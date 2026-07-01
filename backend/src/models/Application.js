const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobId: { type: String, required: true, index: true },
    title: String,
    company: String,
    source: String,
    tier: String,
    jobUrl: String,
    applyUrl: String,
    status: { type: String, default: 'submitted' },
    matchPct: { type: Number, default: null },
    personalMatchPct: { type: Number, default: null },
    interviewLikelihoodPct: { type: Number, default: null },
    notes: String,
    filledFields: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    submittedAt: Date,
    lastAttempted: Date,
  },
  { timestamps: true }
);

applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ userId: 1, lastAttempted: -1 });

module.exports = mongoose.model('Application', applicationSchema);
