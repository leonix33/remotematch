const mongoose = require('mongoose');

const victorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: String,
    type: { type: String, enum: ['onsite', 'offer', 'applied', 'interview', 'other'], default: 'other' },
    company: { type: String, required: true },
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    public: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Victory', victorySchema);
