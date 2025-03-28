const express = require('express');
const {
  getMessages,
  sendMessage,
  deleteMessage,
  getConversations,
  createConversation
} = require('../controllers/messages');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/conversations').get(getConversations).post(createConversation);
router.route('/:conversationId').get(getMessages).post(sendMessage);
router.route('/:id').delete(deleteMessage);

module.exports = router;
