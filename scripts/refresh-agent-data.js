#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const sourceHome = process.env.AGENT_HOME || '/Users/user/job-event-agent';
const targetDir = path.join(__dirname, '../agent-data');

const files = ['seen_jobs.db', 'application_tracker.db'];

fs.mkdirSync(targetDir, { recursive: true });

for (const file of files) {
  const from = path.join(sourceHome, file);
  const to = path.join(targetDir, file);
  if (!fs.existsSync(from)) {
    console.error(`Missing source file: ${from}`);
    process.exit(1);
  }
  fs.copyFileSync(from, to);
  const stats = fs.statSync(to);
  console.log(`Copied ${file} (${Math.round(stats.size / 1024)} KB)`);
}

console.log(`\nAgent data refreshed in ${targetDir}`);
