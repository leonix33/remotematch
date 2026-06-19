const mongoose = require('mongoose');

const turnSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['interviewer', 'candidate', 'feedback'], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobTitle: { type: String, default: 'Software Engineer' },
    company: { type: String, default: 'Tech Company' },
    mode: { type: String, enum: ['text', 'voice'], default: 'text' },
    turns: [turnSchema],
    score: { type: Number, min: 0, max: 100 },
    summary: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
