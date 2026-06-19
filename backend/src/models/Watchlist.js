const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    alertOnNewJobs: { type: Boolean, default: true },
  },
  { timestamps: true }
);

watchlistSchema.index({ userId: 1, company: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
