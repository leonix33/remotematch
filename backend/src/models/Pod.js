const mongoose = require('mongoose');

const podMemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weeklyGoal: { type: Number, default: 5 },
    appliesThisWeek: { type: Number, default: 0 },
    streakWeeks: { type: Number, default: 0 },
  },
  { _id: false }
);

const podSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [podMemberSchema],
    weekStart: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pod', podSchema);
