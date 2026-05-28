const axios = require('axios');

class OllamaService {
    constructor() {
        this.baseURL = 'http://localhost:11434';
        this.model = 'llama3.1:8b';
    }

    async sendMessage(userMessage, chatHistory = []) {
        try {
            const systemPrompt = `تو یک دستیار پشتیبانی فنی مخابرات هستی.
تخصصت: ADSL, VDSL, فیبر نوری, اینترنت خانگی, اشکالالات شبکه, مخابرات
زبان: فارسی
پاسخ‌ها کوتاه، واضح و کاربردی باشند.
اگه سوال فنی هست، مراحل عیب‌یابی رو مرحله به مرحله بگو.`;

            const messages = [
                { role: 'system', content: systemPrompt },
                ...chatHistory,
                { role: 'user', content: userMessage }
            ];

            const response = await axios.post(`${this.baseURL}/api/chat`, {
                model: this.model,
                messages: messages,
                stream: false
            }, {
                timeout: 120000
            });

            return {
                success: true,
                response: response.data.message.content
            };

        } catch (error) {
            console.error('Ollama Error:', error.message);
            return {
                success: false,
                error: 'متأسفانه در ارتباط با هوش مصنوعی مشکلی پیش آمد.'
            };
        }
    }

    async healthCheck() {
        try {
            await axios.get(`${this.baseURL}/api/tags`);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = new OllamaService();