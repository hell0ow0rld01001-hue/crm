const ollamaService = require('../services/ollamoService');

const aiChatPage = (req, res) => {
    res.render('aiChat');
};

const sendToAI = async (req, res) => {
    try {
        const { message, chatHistory } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                error: 'پیام نمی‌تواند خالی باشد' 
            });
        }

        const result = await ollamaService.sendMessage(message, chatHistory || []);
        res.json(result);

    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'خطای سرور' 
        });
    }
};

const checkStatus = async (req, res) => {
    const isOnline = await ollamaService.healthCheck();
    res.json({ online: isOnline });
};

module.exports = {
    aiChatPage,
    sendToAI,
    checkStatus
};