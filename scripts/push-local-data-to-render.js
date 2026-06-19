#!/usr/bin/env node
const path = require('path');
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

process.env.AGENT_HOME = process.env.AGENT_HOME || '/Users/user/job-event-agent';

const jobService = require('../backend/src/services/jobService');

const RENDER_URL = (process.env.RENDER_URL || 'https://remotematch.onrender.com').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const BATCH_SIZE = Number(process.env.IMPORT_BATCH_SIZE || 100);

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text };
  }
  if (!response.ok) {
    throw new Error(body.message || `HTTP ${response.status} for ${url}`);
  }
  return body;
}

async function login() {
  const data = await requestJson(`${RENDER_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  return data.accessToken;
}

async function importInBatches(token, endpoint, key, rows) {
  let imported = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const result = await requestJson(`${RENDER_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ [key]: batch }),
    });
    imported += result.imported || 0;
    console.log(`  ${endpoint}: ${Math.min(i + batch.length, rows.length)}/${rows.length}`);
  }
  return imported;
}

async function main() {
  console.log(`Source AGENT_HOME: ${process.env.AGENT_HOME}`);
  console.log(`Target: ${RENDER_URL}`);

  const jobs = jobService.readJobsFromSqlite(10000);
  const applications = jobService.readApplicationsFromSqlite(10000);
  console.log(`Local jobs: ${jobs.length}`);
  console.log(`Local applications: ${applications.length}`);

  if (!jobs.length && !applications.length) {
    throw new Error('No local SQLite data found. Check AGENT_HOME.');
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env');
  }

  console.log('Logging in to Render...');
  const token = await login();

  let jobCount = 0;
  let appCount = 0;

  if (jobs.length) {
    console.log('Uploading jobs...');
    jobCount = await importInBatches(token, '/api/jobs/import', 'jobs', jobs);
  }

  if (applications.length) {
    console.log('Uploading applications...');
    appCount = await importInBatches(token, '/api/applications/import', 'applications', applications);
  }

  const summary = await requestJson(`${RENDER_URL}/api/analytics/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('\nUpload complete.');
  console.log(`Jobs imported: ${jobCount}`);
  console.log(`Applications imported: ${appCount}`);
  console.log(`Render totalJobs: ${summary.totalJobs}`);
  console.log(`Render totalApplications: ${summary.totalApplications}`);
}

main().catch((err) => {
  console.error(`Push failed: ${err.message}`);
  if (String(err.message).includes('API route not found') || String(err.message).includes('Cannot POST')) {
    console.error('The import API is not deployed yet. Wait for Render deploy, then run this script again.');
  }
  process.exit(1);
});
