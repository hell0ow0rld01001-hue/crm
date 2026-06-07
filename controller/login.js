const { getDb } = require('../model/mongo');
const bcrypt = require('bcryptjs');

const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'fields are empty' });
    }

    const db = getDb();
    const users = await db.collection('users').find({}).toArray();
    let user = null;
    
    for (const u of users) {
      const phoneMatch = await bcrypt.compare(phone, u.phone);
      if (phoneMatch) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'wrong credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.redirect('/wrong-password');
    }

    // Log login history
    await db.collection('login_logs').insertOne({
      userId: user._id.toString(),
      userName: user.name,
      role: user.role || 'user',
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      loginAt: new Date()
    });

    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      role: user.role || 'user'
    };

    res.redirect('/dashboard');

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { login };
