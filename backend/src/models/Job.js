const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    title: String,
    company: String,
    location: String,
    url: String,
    source: String,
    tier: String,
    score: Number,
    matchPct: { type: Number, default: 0 },
    atsType: { type: String, default: 'unknown' },
    emailSection: { type: String, default: 'manual_browse' },
    firstSeen: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
