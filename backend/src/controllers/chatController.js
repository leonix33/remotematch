const { z } = require('zod');
const chatService = require('../services/chatService');

async function contacts(req, res, next) {
  try {
    const list = await chatService.listContacts(req.user.sub);
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function incomingRequests(req, res, next) {
  try {
    const list = await chatService.listIncomingRequests(req.user.sub);
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function summary(req, res, next) {
  try {
    const counts = await chatService.unreadCounts(req.user.sub);
    res.json(counts);
  } catch (err) {
    next(err);
  }
}

const dmRequestSchema = z.object({
  toUserId: z.string().min(1),
  message: z.string().max(500).optional(),
});

async function sendDmRequest(req, res, next) {
  try {
    const body = dmRequestSchema.parse(req.body);
    const request = await chatService.sendDmRequest(req.user.sub, body.toUserId, body.message || '');
    res.status(201).json({ id: request._id, status: request.status });
  } catch (err) {
    next(err);
  }
}

const groupSchema = z.object({
  name: z.string().min(1).max(80),
  memberIds: z.array(z.string()).min(1),
});

async function createGroup(req, res, next) {
  try {
    const body = groupSchema.parse(req.body);
    const conversation = await chatService.createGroup(req.user.sub, body.name, body.memberIds);
    res.status(201).json({ id: conversation._id, name: conversation.name });
  } catch (err) {
    next(err);
  }
}

async function acceptRequest(req, res, next) {
  try {
    const result = await chatService.acceptRequest(req.params.id, req.user.sub);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function declineRequest(req, res, next) {
  try {
    await chatService.declineRequest(req.params.id, req.user.sub);
    res.json({ message: 'Declined' });
  } catch (err) {
    next(err);
  }
}

async function listConversations(req, res, next) {
  try {
    const list = await chatService.listConversations(req.user.sub);
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function getMessages(req, res, next) {
  try {
    const messages = await chatService.getMessages(req.params.id, req.user.sub);
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

const messageSchema = z.object({
  content: z.string().min(1).max(4000),
});

async function sendMessage(req, res, next) {
  try {
    const body = messageSchema.parse(req.body);
    const message = await chatService.sendMessage(req.params.id, req.user.sub, body.content);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  contacts,
  incomingRequests,
  summary,
  sendDmRequest,
  createGroup,
  acceptRequest,
  declineRequest,
  listConversations,
  getMessages,
  sendMessage,
};
