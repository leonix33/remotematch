const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: String,
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const referralThreadSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    replies: [replySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReferralThread', referralThreadSchema);
