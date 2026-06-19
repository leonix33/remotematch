const mongoose = require('mongoose');

const introOfferSchema = new mongoose.Schema(
  {
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferralThread', required: true },
    company: { type: String, required: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromUserName: String,
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'connected', 'declined'], default: 'pending' },
  },
  { timestamps: true }
);

introOfferSchema.index({ threadId: 1, fromUserId: 1 });

module.exports = mongoose.model('IntroOffer', introOfferSchema);
