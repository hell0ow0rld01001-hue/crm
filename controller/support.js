const MessageModel = require('../model/message');
const { getDb } = require('../model/mongo');
const { ObjectId } = require('mongodb');

// middleware: فقط support رول
const requireSupport = async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  const db = getDb();
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.session.user.id) });
  if (!user || user.role !== 'support') return res.redirect('/dashboard');
  req.supportUser = user;
  next();
};

// middleware: support یا premium
const requireSupportOrPremium = async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  const db = getDb();
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.session.user.id) });
  const PREMIUM_ROLES = ['doller1', 'doller5', 'doller10'];
  if (!user || (user.role !== 'support' && !PREMIUM_ROLES.includes(user.role))) return res.redirect('/dashboard');
  req.currentUser = user;
  next();
};

// صفحه اصلی داشبورد پشتیبانی
const supportDashboard = async (req, res) => {
  const db = getDb();
  const allMessages = await MessageModel.findAll(1000);

  // گروه‌بندی بر اساس conversationId
  const conversationsMap = {};
  allMessages.forEach(msg => {
    const cid = msg.conversationId;
    if (!conversationsMap[cid]) {
      conversationsMap[cid] = {
        conversationId: cid,
        userName: null,
        messages: [],
        lastMessage: null,
        unreadCount: 0,
        hasReply: false,
        tag: null
      };
    }
    if (!conversationsMap[cid].userName && msg.role !== 'support') {
      conversationsMap[cid].userName = msg.userName;
      conversationsMap[cid].userId = msg.userId;
    }
    if (msg.role === 'support') conversationsMap[cid].hasReply = true;
    conversationsMap[cid].messages.push(msg);
    conversationsMap[cid].lastMessage = msg;
    if (msg.role !== 'support') conversationsMap[cid].unreadCount++;
  });

  const conversations = Object.values(conversationsMap)
    .filter(c => c.userName)
    .sort((a, b) => new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt));

  // آمار دقیق
  const totalUsers = await db.collection('users').countDocuments({ role: { $ne: 'support' } });
  const totalMessages = allMessages.length;
  const todayMessages = allMessages.filter(m => {
    const d = new Date(m.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;
  const unansweredConvs = conversations.filter(c => !c.hasReply).length;
  const supportMessages = allMessages.filter(m => m.role === 'support').length;

  // تمپلیت‌های پاسخ سریع
  const templates = await db.collection('reply_templates').find({}).toArray();

  res.render('support-dashboard', {
    user: req.session.user,
    conversations,
    totalUsers,
    totalMessages,
    todayMessages,
    unansweredConvs,
    supportMessages,
    templates
  });
};

// API: دریافت پیام‌های یک مکالمه (برای polling)
const getConversation = async (req, res) => {
  const { convId } = req.params;
  const messages = await MessageModel.findByConversationId(convId, 200);
  res.json({ messages });
};

// API: لیست همه مکالمات (برای polling)
const getConversations = async (req, res) => {
  const allMessages = await MessageModel.findAll(1000);
  const map = {};
  allMessages.forEach(msg => {
    const cid = msg.conversationId;
    if (!map[cid]) map[cid] = { conversationId: cid, userName: null, lastMessage: null, count: 0, hasReply: false };
    if (!map[cid].userName && msg.role !== 'support') map[cid].userName = msg.userName;
    if (msg.role === 'support') map[cid].hasReply = true;
    map[cid].lastMessage = msg;
    map[cid].count++;
  });

  const db = getDb();
  const today = new Date().toDateString();
  const todayCount = allMessages.filter(m => new Date(m.createdAt).toDateString() === today).length;

  const conversations = Object.values(map)
    .filter(c => c.userName)
    .sort((a, b) => new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt));

  res.json({
    conversations,
    stats: {
      totalConvs: conversations.length,
      totalMessages: allMessages.length,
      todayMessages: todayCount,
      unanswered: conversations.filter(c => !c.hasReply).length
    }
  });
};

// ارسال پیام از طرف support
const sendSupportMessage = async (req, res) => {
  try {
    const { text, conversationId } = req.body;
    if (!text || !conversationId) return res.status(400).json({ error: 'text and conversationId required' });

    await MessageModel.create({
      conversationId,
      text,
      userId: req.session.user.id,
      userName: req.session.user.name,
      role: 'support'
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Send failed' });
  }
};

// حذف یک پیام توسط مدیر/ساپورت
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.body;
    if (!messageId) return res.status(400).json({ error: 'messageId required' });
    await MessageModel.deleteById(messageId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
};

// حذف کل مکالمه
const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId) return res.status(400).json({ error: 'conversationId required' });
    await MessageModel.deleteByConversationId(conversationId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
};

// ذخیره تمپلیت پاسخ سریع
const saveTemplate = async (req, res) => {
  try {
    const { title, text } = req.body;
    if (!title || !text) return res.status(400).json({ error: 'title and text required' });
    const db = getDb();
    await db.collection('reply_templates').insertOne({
      title, text,
      createdBy: req.session.user.name,
      createdAt: new Date()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
};

// دریافت تمپلیت‌ها
const getTemplates = async (req, res) => {
  try {
    const db = getDb();
    const templates = await db.collection('reply_templates').find({}).toArray();
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
};

module.exports = {
  supportDashboard, requireSupport, requireSupportOrPremium,
  getConversation, getConversations,
  sendSupportMessage,
  deleteMessage, deleteConversation,
  saveTemplate, getTemplates
};
