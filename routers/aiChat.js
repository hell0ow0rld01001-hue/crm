const express = require('express');
const router = express.Router();
const { aiChatPage, sendToAI, checkStatus } = require('../controller/aiChatController');

router.get('/ai-chat', aiChatPage);
router.post('/ai-chat/send', sendToAI);
router.get('/ai-chat/status', checkStatus);
router.get('/test', (req, res) => {
    res.json({ message: 'تست موفق!' });
});
module.exports = router;