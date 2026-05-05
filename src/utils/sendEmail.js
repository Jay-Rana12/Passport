const axios = require('axios');
const fs = require('fs');
const path = require('path');

const sendEmail = async (options) => {
    // Brevo API configuration
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

    // Handle Attachments for Brevo API
    if (options.attachments && options.attachments.length > 0) {
        data.attachment = options.attachments.map(att => {
            try {
                // If path is provided, read file and convert to base64
                if (att.path) {
                    const filePath = path.resolve(att.path);
                    if (fs.existsSync(filePath)) {
                        const content = fs.readFileSync(filePath).toString('base64');
                        return {
                            content: content,
                            name: att.filename || path.basename(filePath)
                        };
                    }
                } 
                // If content is already provided as buffer/string
                else if (att.content) {
                    const content = Buffer.isBuffer(att.content) ? att.content.toString('base64') : Buffer.from(att.content).toString('base64');
                    return {
                        content: content,
                        name: att.filename || 'attachment.pdf'
                    };
                }
                return null;
            } catch (err) {
                console.error(`[SYS] Attachment failed for ${att.filename}:`, err.message);
                return null;
            }
        }).filter(a => a !== null);
    }

    try {
        const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            }
        });

        if (response.data && response.data.messageId) {
            console.log(`✅ Email Sent Successfully via Brevo to: ${options.email} (Attachments: ${data.attachment ? data.attachment.length : 0})`);
            return true;
        }
    } catch (error) {
        console.error('❌ Brevo Email Error:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to send email via Brevo');
    }
};

module.exports = sendEmail;
