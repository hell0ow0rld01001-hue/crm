const { getDb } = require('./mongo');

const MessageModel = {
  async create(message) {
    const db = getDb();
    return await db.collection('messages').insertOne({
      conversationId: message.conversationId,
      userId: message.userId,
      userName: message.userName,
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
  }
};

module.exports = MessageModel;