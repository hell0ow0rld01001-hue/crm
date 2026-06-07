const express = require('express');
const router = express.Router();
const { showPlans, purchasePlan } = require('../controller/plans');

router.get('/plans', showPlans);
router.post('/purchase-plan', purchasePlan);

module.exports = router;
