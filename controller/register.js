const { getDb } = require('../model/mongo');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
  try {
    const { name, phone, password, confirmPassword } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'pls fill the fields' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'password and confirmPassword are not same' });
    }

    const db = getDb();

    const existing = await db.collection('users').findOne({ phone });
    if (existing) {
      return res.status(409).json({ error: 'this phone number is already exist' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const hashedPhone = await bcrypt.hash(phone, 10);

    await db.collection('users').insertOne({
      name,
      phone: hashedPhone,     
      password: hashedPassword,
      role: 'user',
      createdAt: new Date()
    });

    res.redirect("/login");

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register };