const axios = require('axios');

const sendEmail = async (options) => {
    // BREVO API Configuration (HTTP based - bypasses SMTP blocks)
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const SENDER_EMAIL = process.env.EMAIL_USER?.trim() || 'j.r818430@gmail.com';

    if (!BREVO_API_KEY) {
        console.error("[BREVO API] Error: BREVO_API_KEY environment variable is missing!");
        throw new Error("Email service is not configured correctly on server.");
    }

    const data = {
        sender: {
            name: "BorderBridge Support",
            email: SENDER_EMAIL
        },
        to: [{
            email: options.email
        }],
        subject: options.subject,
        htmlContent: options.html || `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
                <h2 style="color: #4f46e5;">Message</h2>
                <p>Hello,</p>
                <p>${options.message}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #999;">&copy; 2026 BorderBridge Travel Services</p>
            </div>
        `
    };

    try {
        console.log(`[BREVO API] Attempting to send email to: ${options.email}`);

        const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            }
        });

        console.log(`[BREVO API] Success! Message ID: ${response.data.messageId}`);
        return response.data;

    } catch (error) {
        console.error('[BREVO API] CRITICAL FAILURE:', error.response ? error.response.data : error.message);
        throw new Error(error.response ? error.response.data.message : 'Failed to send email via Brevo API');
    }
};

module.exports = sendEmail;
