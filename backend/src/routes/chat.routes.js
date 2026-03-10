const express = require('express');
const router = express.Router();
const { getConversations, startConversation, getMessages, sendMessage } = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/conversations', getConversations);
router.post('/conversations', startConversation);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);

module.exports = router;
