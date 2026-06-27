const mongoose = require('mongoose');

const passkeySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    credentialId: { type: String, required: true, unique: true },
    publicKey: { type: Buffer, required: true },
    counter: { type: Number, default: 0 },
    transports: { type: [String], default: [] },
    deviceLabel: { type: String, default: '' },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Passkey', passkeySchema);
