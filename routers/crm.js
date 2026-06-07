const express = require('express');
const router = express.Router();
const {
  crmDashboard, requirePremium,
  updateRevenue,
  createTicket, updateTicketStatus,
  reportNetworkIssue, resolveNetworkIssue,
  upsertSim, getSimCards
} = require('../controller/crm');

// داشبورد اصلی
router.get('/crm', requirePremium, crmDashboard);

// درآمد مشتری
router.post('/crm/update-revenue', requirePremium, updateRevenue);

// تیکت‌ها
router.post('/crm/tickets/create', requirePremium, createTicket);
router.post('/crm/tickets/status', requirePremium, updateTicketStatus);

// مشکلات شبکه
router.post('/crm/network/report', requirePremium, reportNetworkIssue);
router.post('/crm/network/resolve', requirePremium, resolveNetworkIssue);

// سیم‌کارت
router.post('/crm/sim/upsert', requirePremium, upsertSim);
router.get('/crm/sim/list', requirePremium, getSimCards);

module.exports = router;
