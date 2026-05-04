const axios = require('axios');

const sendEmail = async (options) => {
    // Brevo API configuration (Set BREVO_API_KEY in Render Environment Variables)
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const senderEmail = process.env.EMAIL_USER || 'j.r818430@gmail.com'; 
    const senderName = 'BorderBridge Consultancy';

    if (!BREVO_API_KEY) {
        console.error('❌ BREVO_API_KEY is not set in Environment Variables');
        throw new Error('Email service configuration missing');
    }

    const data = {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: options.email }],
        subject: options.subject,
        htmlContent: options.html || options.message,
        textContent: options.message
    };

    try {
        const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            }
        });

        if (response.data && response.data.messageId) {
            console.log(`✅ Email Sent Successfully via Brevo to: ${options.email}`);
            return true;
        }
    } catch (error) {
        console.error('❌ Brevo Email Error:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to send email via Brevo');
    }
};

module.exports = sendEmail;
