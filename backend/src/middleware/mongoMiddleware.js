const mongoose = require('mongoose');
const env = require('../config/env');

function requireMongo(req, res, next) {
  if (!env.mongoUri) {
    return res.status(503).json({
      message:
        'MongoDB is not configured. Set MONGODB_URI in backend/.env locally or in Render environment variables.',
    });
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message:
        'Database is not connected. Start MongoDB locally (npm run mongo:up) or verify your MONGODB_URI connection string.',
    });
  }
  next();
}

module.exports = { requireMongo };
