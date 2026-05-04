const User = require('../models/User');
const Profile = require('../models/Profile');
const VisaApplication = require('../models/VisaApplication');
const PassportApplication = require('../models/PassportApplication');
const StatusHistory = require('../models/StatusHistory');
const sendEmail = require('../utils/sendEmail');
const { generateVisaPDF, generatePassportPDF } = require('../utils/pdfGenerator');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all visa and passport applications
// @route   GET /api/admin/applications
// @access  Private/Admin
exports.getAllApplications = async (req, res) => {
    try {
        const { type, status } = req.query;
        let query = {};
        if (status) query.status = status;

        let visaApps = [];
        let passportApps = [];

        if (!type || type === 'visa') {
            visaApps = await VisaApplication.find(query).populate('user', 'fullName email').sort({ createdAt: -1 });
        }
        if (!type || type === 'passport') {
            passportApps = await PassportApplication.find(query).populate('user', 'fullName email').sort({ createdAt: -1 });
        }

        res.status(200).json({
            success: true,
            data: {
                visa: visaApps,
                passport: passportApps
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update application status
// @route   PUT /api/admin/application/status/:id
// @access  Private/Admin
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status, comment, applicationType } = req.body; // applicationType: 'Visa' or 'Passport'

        let application;
        let modelName;

        if (applicationType === 'Visa') {
            application = await VisaApplication.findById(req.params.id);
            modelName = 'VisaApplication';
        } else {
            application = await PassportApplication.findById(req.params.id);
            modelName = 'PassportApplication';
        }

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        try {
            const oldStatus = application.status;
            application.status = status;
            await application.save();

            // Log history
            await StatusHistory.create({
                applicationId: application._id,
                applicationModel: modelName,
                oldStatus,
                newStatus: status,
                changedBy: req.user.id,
                comment: comment || `Status updated by admin ${req.user.fullName || 'Super Admin'}`
            });

            res.status(200).json({
                success: true,
                data: application
            });
        } catch (saveErr) {
            console.error('[ADMIN] Save Status Error:', saveErr);
            return res.status(500).json({ success: false, message: 'Failed to save application status: ' + saveErr.message });
        }
    } catch (error) {
        console.error('[ADMIN] Update Status Catch:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
};

// @desc    Verify profile
// @route   PUT /api/admin/profile/verify/:userId
// @access  Private/Admin
exports.verifyProfile = async (req, res) => {
    try {
        const { status } = req.body; // 'Verified', 'Rejected', etc.

        const profile = await Profile.findOne({ user: req.params.userId });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        profile.status.verificationStatus = status;
        await profile.save();

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


// @desc    Resend receipts to all submitted applications that don't have them
// @route   POST /api/admin/resend-all-receipts
// @access  Private/Admin
exports.resendAllReceipts = async (req, res) => {
    try {
        console.log('[ADMIN] Starting bulk receipt resend process...');
        
        // 1. Find all active applications (Submitted, Approved, Processing, Pending)
        const activeStatuses = ['Submitted', 'Approved', 'Processing', 'Pending'];
        const visaApps = await VisaApplication.find({ status: { $in: activeStatuses } }).populate('user', 'fullName email');
        const passportApps = await PassportApplication.find({ status: { $in: activeStatuses } }).populate('user', 'fullName email');
        
        let count = 0;
        let errors = 0;

        // Process Visa
        for (const app of visaApps) {
            try {
                const profile = await Profile.findOne({ user: app.user._id });
                const pdfResult = await generateVisaPDF(app, app.user, profile);
                
                await sendEmail({
                    email: app.user.email,
                    subject: `♻️ RE-SENT: Visa Application Receipt - ${app.applicationId}`,
                    message: `Dear ${app.user.fullName},\n\nHumne aapki request ke anusaar aapka Visa Application Receipt firse bhej diya hai. BorderBridge Consultancy par bharosa karne ke liye dhanyavad.\n\nRegards,\nBorderBridge Consultancy Team`,
                    attachments: [
                        {
                            filename: pdfResult.fileName,
                            path: pdfResult.filePath,
                            contentType: 'application/pdf'
                        }
                    ]
                });
                count++;
            } catch (err) {
                console.error(`[ADMIN] Failed to resend Visa ${app.applicationId}:`, err.message);
                errors++;
            }
        }

        // Process Passport
        for (const app of passportApps) {
            try {
                const profile = await Profile.findOne({ user: app.user._id });
                const pdfResult = await generatePassportPDF(app, app.user, profile);
                
                await sendEmail({
                    email: app.user.email,
                    subject: `♻️ RE-SENT: Passport Application Receipt - ${app.applicationId}`,
                    message: `Dear ${app.user.fullName},\n\nHumne aapki request ke anusaar aapka Passport Application Receipt firse bhej diya hai. BorderBridge Consultancy par bharosa karne ke liye dhanyavad.\n\nRegards,\nBorderBridge Consultancy Team`,
                    attachments: [
                        {
                            filename: pdfResult.fileName,
                            path: pdfResult.filePath,
                            contentType: 'application/pdf'
                        }
                    ]
                });
                count++;
            } catch (err) {
                console.error(`[ADMIN] Failed to resend Passport ${app.applicationId}:`, err.message);
                errors++;
            }
        }

        res.status(200).json({
            success: true,
            message: `Successfully re-sent ${count} receipts. Errors: ${errors}`,
            count
        });

    } catch (error) {
        console.error('[ADMIN] Bulk Resend Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
