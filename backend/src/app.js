const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const agentRoutes = require('./routes/agentRoutes');
const generationRoutes = require('./routes/generationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

function createApp() {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(morgan('dev'));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

  app.get('/api/health', (req, res) => {
    const email = env.adminEmail || '';
    res.json({
      ok: true,
      appName: env.appName,
      appUrl: env.appUrl,
      environment: env.nodeEnv,
      deployTag: env.deployTag,
      adminConfigured: Boolean(email && env.adminPassword),
      adminEmailHint: email.includes('@') ? `${email.split('@')[0].slice(0, 3)}***@${email.split('@')[1]}` : 'unset',
      time: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/agent', agentRoutes);
  app.use('/api/generations', generationRoutes);
  app.use('/api/analytics', analyticsRoutes);

  const distPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) res.status(404).send('Frontend not built. Run npm run build.');
    });
  });

  app.use((err, req, res, next) => {
    const status = err.name === 'ZodError' ? 400 : 400;
    res.status(status).json({ message: err.message || 'Server error' });
  });

  return app;
}

module.exports = createApp;
