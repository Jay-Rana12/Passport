
const axios = require('axios');

/**
 * Sends SMS via Fast2SMS (Indian Gateway)
 */
const sendSMS = async (phone, message) => {
    // Fast2SMS expects numbers without +91 (just 10 digits)
    const cleanPhone = phone.replace('+91', '').trim();
    const API_KEY = process.env.FAST2SMS_KEY || '67jVkZ28yOcf3NndDJxbWUA5iPqeg9rFhX0pQCRtumHGEMlKSvQxlHGXNzToYp9SbiIqtgF4wrd7A3ZO';

    console.log(`Sending Real SMS to: ${phone}`);

    try {
        // Using Fast2SMS Bulk V2 API (OTP Route/Quick SMS)
        // Note: For OTP route, variables_values should contain just the code
        const otpMatch = message.match(/\d{6}/);
        const otpCode = otpMatch ? otpMatch[0] : '';

        const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            params: {
                authorization: API_KEY,
                route: 'otp',
                variables_values: otpCode,
                numbers: cleanPhone
            }
        });

        if (response.data && response.data.return) {
            console.log("✅ SMS Sent Successfully via Fast2SMS");
            return true;
        } else {
            console.error("❌ Fast2SMS Error:", response.data.message);
            return false;
        }
    } catch (error) {
        console.error("❌ SMS Gateway Connection Error:", error.message);
        return false;
    }
};

module.exports = sendSMS;
