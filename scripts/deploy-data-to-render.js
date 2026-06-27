#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

console.log('Refreshing agent-data from local SQLite...');
execSync('node scripts/refresh-agent-data.js', { cwd: root, stdio: 'inherit' });

console.log('\nStaging agent-data...');
execSync('git add agent-data/', { cwd: root, stdio: 'inherit' });

const status = execSync('git status --porcelain agent-data/', { cwd: root }).toString().trim();
if (!status) {
  console.log('Agent data already up to date on git.');
} else {
  execSync('git commit -m "Refresh job data snapshot"', { cwd: root, stdio: 'inherit' });
}

console.log('\nPushing to GitHub (Render auto-deploys)...');
execSync('git push origin main', { cwd: root, stdio: 'inherit' });

const { LEGACY_RENDER_URL } = require('../backend/src/constants/brand');
console.log(`\nDone. Wait ~5 minutes for Render deploy, then refresh ${LEGACY_RENDER_URL}`);
