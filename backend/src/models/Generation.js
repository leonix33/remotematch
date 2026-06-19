const mongoose = require('mongoose');

const generationSchema = new mongoose.Schema(
  {
    jobTitle: String,
    company: String,
    platform: { type: String, default: 'cover-letter' },
    tone: { type: String, default: 'Professional' },
    prompt: String,
    content: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Generation', generationSchema);
