
const User = require('../models/User');
const Otp = require('../models/Otp');
const Profile = require('../models/Profile');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const generateOTP = require('../utils/otpUtils');
const { validationResult } = require('express-validator');

// Generate JWT Helper
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};


// @desc    Send OTP to Email
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOtp = async (req, res) => {
    let { email, type } = req.body;
    if (email) email = email.toLowerCase().trim();
    console.log(`[AUTH] sendOtp called for: ${email}, type: ${type}`);

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    try {
        if (type === 'login') {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found with this email' });
            }
        }

        const otp = generateOTP();

        // Save to DB (upsert based on email)
        await Otp.findOneAndUpdate(
            { email },
            { otp, createdAt: Date.now() },
            { upsert: true, new: true }
        );

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({ success: false, message: 'Server configuration error: Email credentials missing' });
        }

        const message = `Your BorderBridge verification code is: ${otp}. Valid for 5 minutes.`;

        // Send Email
        let emailSent = false;
        try {
            await sendEmail({
                email: email,
                subject: 'Verification Code - BorderBridge',
                message: message
            });
            emailSent = true;
        } catch (emailErr) {
            console.error('Email error:', emailErr.message);
        }

        // Send SMS as fallback or secondary
        let smsSent = false;
        if (req.body.phone) {
            smsSent = await sendSMS(req.body.phone, message);
        }

        if (emailSent || smsSent) {
            res.status(200).json({
                success: true,
                message: `Verification code sent to ${emailSent ? 'Email' : ''}${emailSent && smsSent ? ' and ' : ''}${smsSent ? 'SMS' : ''}`
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send verification code. Please check your contact details.',
                debug: 'Both Email and SMS services failed.'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const otpRecord = await Otp.findOne({ email, otp });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        await Otp.deleteOne({ _id: otpRecord._id });

        res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error verifying OTP' });
    }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, phone, password, role, otp } = req.body;

    try {
        // Verify OTP first
        const otpRecord = await Otp.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // If a role was provided (e.g. admin during first setup), we can allow it,
        // but usually registration defaults to 'applicant'
        const adminEmail = 'j.r818430@gmail.com';
        const finalRole = (email === adminEmail) ? (role || 'admin') : (role || 'applicant');

        user = await User.create({
            fullName,
            email,
            phone,
            password: hashedPassword,
            role: finalRole
        });

        // Delete OTP record
        await Otp.deleteOne({ _id: otpRecord._id });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    let { email, password, otp } = req.body;
    if (email) email = email.toLowerCase().trim();

    try {
        // Check for user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // If OTP is provided, verify it
        if (otp) {
            const otpRecord = await Otp.findOne({ email, otp });
            if (!otpRecord) {
                return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
            }
            await Otp.deleteOne({ _id: otpRecord._id });

            const token = generateToken(user._id);

            // Fetch profile to get profile photo if it exists
            const profile = await Profile.findOne({ user: user._id });

            const finalRole = user.role;


            return res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: finalRole,
                    profilePhoto: profile && profile.uploads && profile.uploads.profilePhoto ? profile.uploads.profilePhoto : null
                }
            });
        }

        // If no OTP, return a flag that OTP is needed
        res.json({
            success: false,
            otpRequired: true,
            email: user.email,
            message: 'OTP required to complete login'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/profile
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Forgot Password (Send OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate 6 digit OTP
        const otp = generateOTP();

        // Set OTP and Expiry (10 mins)
        user.resetPasswordToken = otp; // In a real app, hash this token
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        const message = `Your password reset OTP is: ${otp}. Valid for 10 minutes.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset OTP',
                message,
            });

            res.status(200).json({ success: true, message: 'OTP sent to email' });
        } catch (error) {
            console.error(error);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ success: false, message: 'Email could not be sent' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const user = await User.findOne({
            email,
            resetPasswordToken: otp,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or Expired OTP' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear reset token
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ success: true, message: 'Password Reset Successful' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

