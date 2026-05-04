const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const sendEmail = async (options) => {
    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use STARTTLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 15000
    });

    // 2. Define email options
    let attachments = [];
    if (options.attachments && options.attachments.length > 0) {
        attachments = options.attachments.map(a => {
            if (a.path) {
                const resolvedPath = path.resolve(a.path);
                if (fs.existsSync(resolvedPath)) {
                    return { ...a, path: resolvedPath };
                }
                return null;
            }
            return a;
        }).filter(a => a !== null);
    }

    const mailOptions = {
        from: `"BorderBridge Support" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2>BorderBridge Verification</h2>
                <p>${options.message}</p>
            </div>
        `,
        attachments
    };

    // 3. Actually send the email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[SYS] Email Sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('[SYS] Email Failed:', error.message);
        throw error;
    }
};

module.exports = sendEmail;
