const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
dotenv.config({ path: "./config/config.env" });
const { connectDB } = require('./model/mongo.js'); 

// Routes
const dashboard   = require('./routers/dashboard.js');
const aiChatRoutes= require('./routers/aiChat');
const loginRoutes = require('./routers/login');
const registerRoutes = require('./routers/register');
const loginShow   = require('./routers/loginShow');
const registerShow= require('./routers/registerShow');
const chatRoutes  = require('./routers/chat');
const logoutRoutes= require('./routers/logout');
const plansRoutes = require('./routers/plans');
const crmRoutes   = require('./routers/crm');
const supportRoutes = require('./routers/support');   // ← جدید
const fourcontroller = require('./controller/404.js');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: 'my-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(dashboard);
app.use("/check", loginRoutes);
app.use("/check", registerRoutes);
app.use(loginShow);
app.use(registerShow);
app.use(chatRoutes);
app.use(logoutRoutes);
app.use(aiChatRoutes);
app.use(plansRoutes);
app.use(crmRoutes);
app.use(supportRoutes);   // ← جدید

app.use(fourcontroller.get404);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.error("Database Error:", err));
