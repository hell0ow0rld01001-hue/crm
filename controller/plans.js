const { getDb } = require('../model/mongo');
const { ObjectId } = require('mongodb');

const PLAN_DURATION_DAYS = 30;   

const PLANS = {
  '1':  {
    name: 'Starter',
    price: 1,
    role: 'doller1',
    durationDays: PLAN_DURATION_DAYS,
    features: [
      'View support messages',
      'View login history',
      'View customer revenue',
      'Basic analytics dashboard',
      'Up to 50 customers'
    ]
  },
  '5':  {
    name: 'Pro',
    price: 5,
    role: 'doller5',
    durationDays: PLAN_DURATION_DAYS,
    features: [
      'Everything in Starter',
      'Priority support',
      'Advanced analytics',
      'Ticket management system',
      'Up to 500 customers',
      'Network issue tracking'
    ]
  },
  '10': {
    name: 'Business',
    price: 10,
    role: 'doller10',
    durationDays: PLAN_DURATION_DAYS,
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Full CRM access',
      'SIM card management',
      'Unlimited customers',
      'KPI & churn analytics',
      'Renewal alerts'
    ]
  }
};

// نمایش صفحه پلن‌ها
const showPlans = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const db = getDb();
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.session.user.id) });

  // محاسبه روزهای باقیمانده پلن
  let remainingDays = 0;
  let planExpiresAt = null;
  if (user.planExpiresAt) {
    planExpiresAt = new Date(user.planExpiresAt);
    remainingDays = Math.max(0, Math.ceil((planExpiresAt - new Date()) / (1000 * 60 * 60 * 24)));
  }

  res.render('plans', {
    user: req.session.user,
    plans: PLANS,
    currentRole: user.role,
    remainingDays,
    planExpiresAt,
    planDurationDays: PLAN_DURATION_DAYS
  });
};

// خرید پلن
const purchasePlan = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const { plan } = req.body;
  const planData = PLANS[plan];

  if (!planData) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  try {
    const db = getDb();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + planData.durationDays * 24 * 60 * 60 * 1000);

    // آپدیت اطلاعات کاربر در دیتابیس
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.session.user.id) },
      {
        $set: {
          role: planData.role,
          planPrice: planData.price,
          planName: planData.name,
          planDurationDays: planData.durationDays,
          planPurchasedAt: now,
          planExpiresAt: expiresAt    // ← ذخیره تاریخ انقضا در دیتابیس
        }
      }
    );

    // آپدیت سشن
    req.session.user.role = planData.role;

    // ثبت در لاگ خرید
    await db.collection('plan_purchases').insertOne({
      userId: req.session.user.id,
      userName: req.session.user.name,
      plan: planData.name,
      price: planData.price,
      role: planData.role,
      durationDays: planData.durationDays,
      purchasedAt: now,
      expiresAt: expiresAt
    });

    res.redirect('/crm');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Purchase failed' });
  }
};

module.exports = { showPlans, purchasePlan, PLANS, PLAN_DURATION_DAYS };
