const sendEmail = require('../utils/sendEmail');

exports.sendContactEmail = async (req, res) => {
    const { name, email, phone, service, message } = req.body;

    try {
        await sendEmail({
            email: process.env.EMAIL_USER, // Admin ko mail bhejna hai
            subject: `New Contact Form Submission from ${name}`,
            message: `New Consultation Request\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nService: ${service}\nMessage: ${message}`,
            html: `
                <h3>New Consultation Request</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <p><strong>Service:</strong> ${service}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `
        });

        res.status(200).json({
            success: true,
            message: 'Email sent successfully'
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email'
        });
    }
};

