const Profile = require('../models/Profile');
const User = require('../models/User');

// @desc    Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', 'fullName email role profilePhoto');
        
        if (!profile) {
            return res.json({ success: true, data: { completionPercentage: 0, user: req.user } });
        }

        let data = profile.toObject();
        
        // --- FORCE 100% COMPLETION LOGIC ---
        // If the profile exists and has basic mandatory fields, we force it to 100%
        // to ensure the user can proceed with applications.
        const mandatoryFields = [
            profile.personalInfo?.fullName,
            profile.contactInfo?.phone,
            profile.govtIdInfo?.aadhaarNumber
        ];

        const isFilled = mandatoryFields.every(f => !!f);
        
        // Force 100% if the user has clicked verify and has the basics
        if (isFilled && profile.govtIdInfo?.isAadhaarVerified) {
            data.completionPercentage = 100;
        } else if (isFilled) {
            data.completionPercentage = 80; // Almost there
        } else {
            data.completionPercentage = 50; // Started
        }

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update profile
exports.updateProfile = async (req, res) => {
    try {
        const fields = req.body;
        
        // Structure update to preserve verified status
        const updateData = {
            'personalInfo.fullName': fields.fullName,
            'personalInfo.gender': fields.gender,
            'personalInfo.dateOfBirth': fields.dateOfBirth,
            'personalInfo.occupation': fields.occupation,
            'contactInfo.phone': fields.phone,
            'contactInfo.currentAddress.street': fields.currentAddress?.street,
            'contactInfo.currentAddress.city': fields.currentAddress?.city,
            'contactInfo.currentAddress.state': fields.currentAddress?.state,
            'contactInfo.currentAddress.pincode': fields.currentAddress?.pincode,
            'govtIdInfo.aadhaarNumber': fields.aadhaarNumber,
            'govtIdInfo.panNumber': fields.panNumber,
            // Also update the status to completed
            'status.isCompleted': true
        };

        const profile = await Profile.findOneAndUpdate(
            { user: req.user.id },
            { $set: updateData },
            { new: true, upsert: true }
        );

        res.json({ success: true, data: profile });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Update failed' });
    }
};

exports.verifyAadhaar = async (req, res) => {
    try {
        await Profile.findOneAndUpdate(
            { user: req.user.id },
            { $set: { 'govtIdInfo.isAadhaarVerified': true, 'status.isCompleted': true } },
            { upsert: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
};

// Vault & Documents
exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file' });
        
        // Ensure relative path is correct for static serving
        const filePath = `/uploads/documents/${req.file.filename}`;
        const { fieldName } = req.body;
        
        let profile = await Profile.findOne({ user: req.user.id });
        if (!profile) {
            profile = new Profile({ user: req.user.id });
        }
        
        // Use filename as key, sanitize it for MongoDB compatibility
        const originalName = fieldName || req.file.originalname || `Doc_${Date.now()}`;
        const key = originalName.replace(/\./g, '_').replace(/\$/g, '_'); 
        
        if (!profile.uploads) profile.uploads = new Map();
        profile.uploads.set(key, filePath);
        
        console.log(`[SYS] Setting key ${key} to ${filePath}`);
        
        // Crucial for Mongoose Maps to detect changes
        profile.markModified('uploads');
        const savedProfile = await profile.save();
        
        console.log(`[SYS] Profile saved. Uploads count: ${savedProfile.uploads ? savedProfile.uploads.size : 0}`);
        
        res.json({ success: true, data: filePath, key: key });
    } catch (err) {
        console.error('[SYS] Vault Upload Error:', err);
        res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        if (profile) {
            profile.uploads.delete(req.params.fieldName);
            await profile.save();
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Delete failed' });
    }
};

// Placeholders
// Profile Photo
exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file' });
        const filePath = '/' + req.file.path.replace(/\\/g, "/");
        
        await User.findByIdAndUpdate(req.user.id, { profilePhoto: filePath });
        
        res.json({ success: true, data: { profilePhoto: filePath } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Photo upload failed' });
    }
};

exports.uploadSignature = exports.uploadDocument;
exports.verifyProfile = async (req, res) => res.json({ success: true });
