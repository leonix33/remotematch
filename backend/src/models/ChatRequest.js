const mongoose = require('mongoose');

const chatRequestSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    type: { type: String, enum: ['dm', 'group'], default: 'dm' },
    introMessage: { type: String, default: '', trim: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  },
  { timestamps: true }
);

chatRequestSchema.index({ toUserId: 1, status: 1 });
chatRequestSchema.index({ fromUserId: 1, toUserId: 1, status: 1 });

module.exports = mongoose.model('ChatRequest', chatRequestSchema);
