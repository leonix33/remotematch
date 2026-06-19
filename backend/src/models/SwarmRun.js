const mongoose = require('mongoose');

const swarmRunSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['running', 'complete', 'failed'], default: 'running' },
    stages: {
      scout: { status: String, result: String, completedAt: Date },
      writer: { status: String, result: String, completedAt: Date },
      reviewer: { status: String, result: String, completedAt: Date },
    },
    jobIds: [String],
    summary: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('SwarmRun', swarmRunSchema);
