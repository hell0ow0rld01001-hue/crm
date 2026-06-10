const express = require('express');
const router = express.Router();
const {
  supportDashboard,
  requireSupport,
  requireSupportOrPremium,
  getConversation,
  getConversations,
  sendSupportMessage,
  deleteMessage,
  deleteConversation,
  saveTemplate,
  getTemplates
} = require('../controller/support');

router.get('/support', requireSupport, supportDashboard);
router.get('/support/api/conversations', requireSupportOrPremium, getConversations);
router.get('/support/api/conversation/:convId', requireSupportOrPremium, getConversation);
router.post('/support/send', requireSupportOrPremium, sendSupportMessage);
router.post('/support/api/message/delete', requireSupportOrPremium, deleteMessage);
router.post('/support/api/conversation/delete', requireSupportOrPremium, deleteConversation);
router.post('/support/api/templates/save', requireSupportOrPremium, saveTemplate);
router.get('/support/api/templates', requireSupportOrPremium, getTemplates);

module.exports = router;
