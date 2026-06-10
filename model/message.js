const { getDb } = require('./mongo');
const { ObjectId } = require('mongodb');

const MessageModel = {
  async create(message) {
    const db = getDb();
    return await db.collection('messages').insertOne({
      conversationId: message.conversationId,
      userId: message.userId,
      userName: message.userName,
      role: message.role,
      text: message.text,
      createdAt: new Date()
    });
  },

  async findByConversationId(conversationId, limit = 50) {
    const db = getDb();
    return await db.collection('messages')
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray();
  },

  async findAll(limit = 50) {
    const db = getDb();
    return await db.collection('messages')
      .find()
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray();
  },

  async deleteById(messageId) {
    const db = getDb();
    return await db.collection('messages').deleteOne({ _id: new ObjectId(messageId) });
  },

  async deleteByConversationId(conversationId) {
    const db = getDb();
    return await db.collection('messages').deleteMany({ conversationId });
  }
};

module.exports = MessageModel;
