const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../model/mongo');
const router = express.Router();

router.get("/dashboard", async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  let userRole = req.session.user.role || 'user';
  let remainingDays = 0;
  let remainingPercent = 0;
  let planExpiresAt = null;
  let planDurationDays = 30;

  try {
    const db = getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.session.user.id) });
    if (user) {
      userRole = user.role;
      req.session.user.role = userRole;

      // ریدایرکت support به پنل اختصاصی
      if (userRole === 'support') return res.redirect('/support');

      if (user.planExpiresAt) {
        planExpiresAt = new Date(user.planExpiresAt);
        planDurationDays = user.planDurationDays || 30;
        remainingDays = Math.max(0, Math.ceil((planExpiresAt - new Date()) / (1000 * 60 * 60 * 24)));
        remainingPercent = Math.round((remainingDays / planDurationDays) * 100);
        remainingPercent = Math.min(100, Math.max(0, remainingPercent));
      }
    }
  } catch(e) { console.error(e); }

  res.render("dashboard", {
    user: req.session.user,
    userRole,
    remainingDays,
    remainingPercent,
    planExpiresAt,
    planDurationDays
  });
});

module.exports = router;
