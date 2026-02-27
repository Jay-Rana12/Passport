const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Standard SMTP transporter for Gmail
    const emailUser = (process.env.EMAIL_USER || "").trim();
    const emailPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, '');

    if (!emailUser || !emailPass) {
        console.error("[EMAIL] Error: EMAIL_USER or EMAIL_PASS environment variables are missing!");
        throw new Error("Email credentials not configured on server.");
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Port 587 use STARTTLS
        auth: {
            user: emailUser,
            pass: emailPass,
        },
        logger: true,
        debug: true,
        connectionTimeout: 10000,
        socketTimeout: 10000
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

