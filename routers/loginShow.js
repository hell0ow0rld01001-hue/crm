const express = require('express');
const router = express.Router();

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/wrong-password", (req, res) => {
  res.render("wrong-password");
});

module.exports = router;