const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const aiChatSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    messages: [aiMessageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('AiChatSession', aiChatSessionSchema);
