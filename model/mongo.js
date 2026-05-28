
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("mycrm_db");
    console.log("database connected");
  } catch (error) {
    console.error("data base error :", error);
    process.exit(1);
  }
}

const getDb = () => {
  if (!db) {
    throw new Error("data base is offline");
  }
  return db;
};

module.exports = { connectDB, getDb };