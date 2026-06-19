const CalendarEvent = require('../models/CalendarEvent');
const Notification = require('../models/Notification');
const emailService = require('./emailService');
const env = require('../config/env');

async function sendUpcomingReminders() {
  if (!env.mongoUri) return;

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const events = await CalendarEvent.find({
    startDate: { $gte: now, $lte: in24h },
    type: { $in: ['interview', 'deadline', 'application'] },
  }).lean();

  for (const event of events) {
    const exists = await Notification.findOne({
      userId: event.userId,
      type: 'system',
      'meta.eventId': event._id.toString(),
      createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    });
    if (exists) continue;

    const when = new Date(event.startDate).toLocaleString();
    await Notification.create({
      userId: event.userId,
      type: 'system',
      title: `Reminder: ${event.title}`,
      body: `${when}${event.location ? ` · ${event.location}` : ''}`,
      link: '/calendar',
      meta: { eventId: event._id.toString() },
    });

    try {
      await emailService.notifyInterviewReminder(event.userId, {
        title: event.title,
        when,
        location: event.location,
      });
    } catch {
      /* optional */
    }
  }
}

function startReminderCron() {
  if (!env.mongoUri) return;
  sendUpcomingReminders();
  setInterval(sendUpcomingReminders, 60 * 60 * 1000);
}

module.exports = { sendUpcomingReminders, startReminderCron };
