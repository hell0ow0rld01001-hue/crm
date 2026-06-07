const { getDb } = require('../model/mongo');
const { ObjectId } = require('mongodb');
const MessageModel = require('../model/message');

const PREMIUM_ROLES = ['doller1', 'doller5', 'doller10'];

// ---- میدلور بررسی دسترسی ----
const requirePremium = async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  const db = getDb();
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.session.user.id) });
  if (!user || !PREMIUM_ROLES.includes(user.role)) return res.redirect('/plans');
  req.currentUser = user;
  next();
};

// ---- داشبورد اصلی CRM ----
const crmDashboard = async (req, res) => {
  const db = getDb();

  // پیام‌های پشتیبانی
  const allMessages = await MessageModel.findAll(500);
  const conversations = {};
  allMessages.forEach(msg => {
    if (!conversations[msg.conversationId]) {
      conversations[msg.conversationId] = { userId: msg.conversationId, userName: msg.userId === msg.conversationId ? msg.userName : 'Support', messages: [], lastMessage: null };
    }
    conversations[msg.conversationId].messages.push(msg);
    conversations[msg.conversationId].lastMessage = msg;
  });

  // لاگ لاگین
  const loginLogs = await db.collection('login_logs').find({}).sort({ loginAt: -1 }).limit(100).toArray();

  // کاربران
  const users = await db.collection('users').find({}, { projection: { password: 0, phone: 0 } }).sort({ createdAt: -1 }).toArray();

  // تیکت‌های پشتیبانی
  const tickets = await db.collection('tickets').find({}).sort({ createdAt: -1 }).limit(100).toArray();

  // مشکلات شبکه
  const networkIssues = await db.collection('network_issues').find({}).sort({ reportedAt: -1 }).limit(50).toArray();

  // خریدهای پلن (برای تجدید)
  const planPurchases = await db.collection('plan_purchases').find({}).sort({ purchasedAt: -1 }).limit(50).toArray();

  // ---- محاسبه KPIها ----
  const now = new Date();
  const activeUsers = users.filter(u => PREMIUM_ROLES.includes(u.role));
  const expiringUsers = users.filter(u => {
    if (!u.planExpiresAt) return false;
    const diff = (new Date(u.planExpiresAt) - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 5;
  });

  const totalRevenue = users.reduce((s, u) => s + (u.businessRevenue || 0), 0);
  const planRevenue = planPurchases.reduce((s, p) => s + (p.price || 0), 0);
  const arpu = activeUsers.length > 0 ? (totalRevenue / activeUsers.length).toFixed(2) : 0;
  const churnRate = users.length > 0 ? (((users.length - activeUsers.length) / users.length) * 100).toFixed(1) : 0;

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
  const openNetworkIssues = networkIssues.filter(n => n.status === 'open').length;

  res.render('crm-dashboard', {
    user: req.session.user,
    currentUser: req.currentUser,
    conversations: Object.values(conversations),
    loginLogs,
    users,
    tickets,
    networkIssues,
    planPurchases,
    expiringUsers,
    kpi: {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      supportMsgs: allMessages.length,
      loginEvents: loginLogs.length,
      totalRevenue: totalRevenue.toFixed(2),
      planRevenue: planRevenue.toFixed(2),
      arpu,
      churnRate,
      openTickets,
      resolvedTickets,
      openNetworkIssues,
      expiringCount: expiringUsers.length
    }
  });
};

// ---- آپدیت درآمد ----
const updateRevenue = async (req, res) => {
  const { userId, revenue } = req.body;
  if (!userId || revenue === undefined) return res.status(400).json({ error: 'userId and revenue required' });
  try {
    const db = getDb();
    await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { businessRevenue: parseFloat(revenue) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Update failed' });
  }
};

// ---- ایجاد تیکت جدید ----
const createTicket = async (req, res) => {
  const { title, description, priority, customerName } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'title and description required' });
  try {
    const db = getDb();
    await db.collection('tickets').insertOne({
      title, description,
      priority: priority || 'medium',
      customerName: customerName || 'Unknown',
      status: 'open',
      assignedTo: req.session.user.name,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
};

// ---- تغییر وضعیت تیکت ----
const updateTicketStatus = async (req, res) => {
  const { ticketId, status } = req.body;
  try {
    const db = getDb();
    await db.collection('tickets').updateOne(
      { _id: new ObjectId(ticketId) },
      { $set: { status, updatedAt: new Date() } }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
};

const reportNetworkIssue = async (req, res) => {
  const { area, type, description, severity } = req.body;
  if (!area || !type) return res.status(400).json({ error: 'area and type required' });
  try {
    const db = getDb();
    await db.collection('network_issues').insertOne({
      area, type, description: description || '',
      severity: severity || 'medium',
      status: 'open',
      reportedBy: req.session.user.name,
      reportedAt: new Date(),
      updatedAt: new Date()
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
};

const resolveNetworkIssue = async (req, res) => {
  const { issueId } = req.body;
  try {
    const db = getDb();
    await db.collection('network_issues').updateOne(
      { _id: new ObjectId(issueId) },
      { $set: { status: 'resolved', resolvedAt: new Date(), resolvedBy: req.session.user.name } }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
};

const upsertSim = async (req, res) => {
  const { userId, iccid, msisdn, simType, status } = req.body;
  if (!userId || !msisdn) return res.status(400).json({ error: 'userId and msisdn required' });
  try {
    const db = getDb();
    await db.collection('sim_cards').updateOne(
      { userId },
      { $set: { userId, iccid, msisdn, simType: simType || '4G', status: status || 'active', updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
};

const getSimCards = async (req, res) => {
  try {
    const db = getDb();
    const sims = await db.collection('sim_cards').find({}).toArray();
    res.json(sims);
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
};

module.exports = {
  crmDashboard, requirePremium,
  updateRevenue,
  createTicket, updateTicketStatus,
  reportNetworkIssue, resolveNetworkIssue,
  upsertSim, getSimCards
};
