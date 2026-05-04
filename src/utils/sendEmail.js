const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS?.replace(/\s/g, ''),
        },
    });

    // 2. Define email options
    const mailOptions = {
        from: `"BorderBridge Support" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; border: 1px solid #e2e8f0; border-radius: 15px; max-width: 500px; color: #1e293b;">
                <h2 style="color: #3b82f6; margin-top: 0;">BorderBridge Verification</h2>
                <p style="font-size: 16px; line-height: 1.6;">Hello,</p>
                <p style="font-size: 16px; line-height: 1.6; background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    ${options.message}
                </p>
                <p style="font-size: 14px; color: #64748b; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;">
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">&copy; 2026 BorderBridge Travel Services. All Rights Reserved.</p>
            </div>
        `,
        attachments: options.attachments || []
    };

    // 3. Actually send the email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[SYS] Email Sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('[SYS] Email Failed:', error.message);
        throw new Error('Email service failure: ' + error.message);
    }
};

module.exports = sendEmail;
