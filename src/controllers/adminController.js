const User = require('../models/User');
const Profile = require('../models/Profile');
const VisaApplication = require('../models/VisaApplication');
const PassportApplication = require('../models/PassportApplication');
const StatusHistory = require('../models/StatusHistory');

// @desc    Get all users
// @route   GET https://passport-ia5r.onrender.com/api/admin/users
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
// @route   GET https://passport-ia5r.onrender.com/api/admin/applications
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
// @route   PUT https://passport-ia5r.onrender.com/api/admin/application/status/:id
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
// @route   PUT https://passport-ia5r.onrender.com/api/admin/profile/verify/:userId
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
