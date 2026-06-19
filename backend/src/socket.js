const jwt = require('jsonwebtoken');
const env = require('./config/env');
const chatService = require('./services/chatService');
const notificationService = require('./services/notificationService');

const typingUsers = new Map();

function initSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = jwt.verify(token, env.jwtAccessSecret);
      socket.userId = payload.sub;
      socket.userName = payload.name || payload.email;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    notificationService.setEmitter((userId, event, data) => {
      io.to(`user:${userId}`).emit(event, data);
    });

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('typing', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing', {
        userId: socket.userId,
        userName: socket.userName,
        conversationId,
      });
    });

    socket.on('send_message', async ({ conversationId, content }, ack) => {
      try {
        const message = await chatService.sendMessage(conversationId, socket.userId, content);
        io.to(`conv:${conversationId}`).emit('new_message', { conversationId, message });

        const conversation = await require('./models/Conversation').findById(conversationId);
        if (conversation) {
          for (const m of conversation.members) {
            if (m.userId.toString() !== socket.userId.toString()) {
              await notificationService.create(m.userId, {
                type: 'chat_message',
                title: `Message from ${socket.userName}`,
                body: content.slice(0, 80),
                link: '/chat',
                meta: { conversationId },
              });
            }
          }
        }
        if (typeof ack === 'function') ack({ ok: true, message });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
      }
    });
  });
}

module.exports = { initSocket };
