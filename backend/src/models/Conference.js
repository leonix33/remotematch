const mongoose = require('mongoose');

const conferenceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    format: { type: String, enum: ['remote', 'in_person', 'hybrid'], default: 'remote' },
    location: { type: String, default: 'Online' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: Date,
    url: { type: String, default: '' },
    tags: [String],
    recurring: { type: String, enum: ['none', 'weekly', 'monthly', 'annual'], default: 'none' },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

conferenceSchema.index({ startDate: 1 });

module.exports = mongoose.model('Conference', conferenceSchema);
