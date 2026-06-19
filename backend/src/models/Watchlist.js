const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    alertOnNewJobs: { type: Boolean, default: true },
    shared: { type: Boolean, default: false },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', index: true },
  },
  { timestamps: true }
);

watchlistSchema.index({ userId: 1, company: 1 }, { unique: true });
watchlistSchema.index({ teamId: 1, company: 1, shared: 1 });

module.exports = mongoose.model('Watchlist', watchlistSchema);
