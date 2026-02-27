const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Standard SMTP transporter for Gmail
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use STARTTLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 5000,    // 5 seconds
        socketTimeout: 15000      // 15 seconds
    });

    const mailOptions = {
        from: `"BorderBridge Support" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
                <h2 style="color: #4f46e5;">Message</h2>
                <p>Hello,</p>
                <p>${options.message}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #999;">&copy; 2026 BorderBridge Travel Services</p>
            </div>
        `,
        attachments: options.attachments || [] // Add attachments support
    };

    try {
        console.log(`[EMAIL] Attempting to send email to: ${options.email}`);
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Success! Sent to: ${options.email}`);
    } catch (error) {
        console.error('[EMAIL] CRITICAL FAILURE:', error);
        throw error;
    }
};

module.exports = sendEmail;

