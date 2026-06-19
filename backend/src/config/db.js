const mongoose = require('mongoose');
const { mongoUri } = require('./env');

async function connectDb() {
  if (!mongoUri) {
    console.warn('MONGODB_URI is missing — user auth and generations require MongoDB Atlas.');
    return false;
  }
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
  return true;
}

module.exports = connectDb;
