const MessageModel = require('../model/Message');

const chatPage = async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  
  const messages = await MessageModel.findAll(50);
  
  res.render('chat', { 
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

    await MessageModel.create({
      text,
      userId: req.session.user.id,
      userName: req.session.user.name
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'خطا در ارسال پیام' });
  }
};

module.exports = { chatPage, sendMessage };