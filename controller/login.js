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
      return res.status(401).json({ error: 'wrong password' });
    }

    req.session.user = {
      id: user._id.toString(),
      name: user.name
    };

    res.redirect('/dashboard');

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { login };