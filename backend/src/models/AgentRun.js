const mongoose = require('mongoose');

const agentRunSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
    newItems: { type: Number, default: 0 },
    output: String,
    error: String,
    startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    finishedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('AgentRun', agentRunSchema);
