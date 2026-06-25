const linkedinVisibilityService = require('../services/linkedinVisibilityService');

async function list(req, res, next) {
  try {
    res.json(linkedinVisibilityService.listPosts(req.user.sub));
  } catch (err) {
    next(err);
  }
}

async function generate(req, res, next) {
  try {
    const { count, focus } = req.body || {};
    const posts = await linkedinVisibilityService.generateProjects(req.user.sub, { count, focus });
    res.status(201).json({ posts, count: posts.length });
  } catch (err) {
    next(err);
  }
}

async function markPosted(req, res, next) {
  try {
    const post = await linkedinVisibilityService.markPosted(req.user.sub, req.params.id);
    res.json(post);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    linkedinVisibilityService.deletePost(req.user.sub, req.params.id);
    res.json({ message: 'Removed' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, generate, markPosted, remove };
