#!/usr/bin/env node
const path = require('path');
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

process.env.AGENT_HOME = process.env.AGENT_HOME || '/Users/user/job-event-agent';

const env = require('../backend/src/config/env');
const connectDb = require('../backend/src/config/db');
const jobService = require('../backend/src/services/jobService');

async function main() {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI is missing in backend/.env. Copy it from Render Environment.');
  }

  console.log(`AGENT_HOME: ${process.env.AGENT_HOME}`);
  console.log('Connecting to MongoDB...');
  await connectDb();

  const jobs = jobService.readJobsFromSqlite(10000);
  const applications = jobService.readApplicationsFromSqlite(10000);
  console.log(`Local jobs: ${jobs.length}`);
  console.log(`Local applications: ${applications.length}`);

  const syncedJobs = await jobService.syncJobsToMongo();
  const syncedApps = await jobService.syncApplicationsToMongo();

  console.log(`Synced jobs: ${syncedJobs}`);
  console.log(`Synced applications: ${syncedApps}`);
}

main().catch((err) => {
  console.error(`Sync failed: ${err.message}`);
  process.exit(1);
});
