const MessageModel = require('../model/Message');
const { getDb } = require('../model/mongo');

const chatPage = async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  
  const db = getDb();
  const { ObjectId } = require('mongodb');
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.session.user.id) });
  
  let messages = [];
  const isSupport = user && user.role === 'support';
  
  if (isSupport) {
    messages = await MessageModel.findAll(200);
    return res.render('chat-support', { 
      user: req.session.user,
      messages
    });
  }
  
  messages = await MessageModel.findByConversationId(req.session.user.id, 50);
  res.render('chat-user', { 
    user: req.session.user,
    messages
  });
};

const sendMessage = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'لطفاً لاگین کنید' });
    }
    
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'پیام نمی‌تواند خالی باشد' });
    }

    const db = getDb();
    const user = await db.collection('users').findOne({ _id: new (require('mongodb')).ObjectId(req.session.user.id) });
    
    // اگر support باشد، conversationId از query گرفته می‌شود
    let conversationId = req.session.user.id;
    if (user && user.role === 'support' && req.body.conversationId) {
      conversationId = req.body.conversationId;
    }

    await MessageModel.create({
      conversationId,
      text,
      userId: req.session.user.id,
      userName: req.session.user.name,
      role: user.role
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در ارسال پیام' });
  }
};

module.exports = { chatPage, sendMessage };