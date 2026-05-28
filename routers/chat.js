const express = require('express');
const router = express.Router();
const { chatPage, sendMessage } = require('../controller/chat');

router.get('/chat', chatPage);
router.post('/chat/send', sendMessage);

module.exports = router;