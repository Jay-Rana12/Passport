const Profile = require('../models/Profile');
const User = require('../models/User');

// @desc    Get current user profile
// @route   GET https://passport-ia5r.onrender.com/api/profile/me
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', 'name email role');

        let data = profile ? profile.toObject() : {};

        // Calculate completion percentage dynamically
        let filledCount = 0;
        if (profile) {
            // Personal (8)
            if (profile.personalInfo?.fullName) filledCount++;
            if (profile.personalInfo?.fatherName) filledCount++;
            if (profile.personalInfo?.motherName) filledCount++;
            if (profile.personalInfo?.gender) filledCount++;
            if (profile.personalInfo?.dateOfBirth) filledCount++;
            if (profile.personalInfo?.placeOfBirth) filledCount++;
            if (profile.personalInfo?.nationality) filledCount++;
            if (profile.personalInfo?.maritalStatus) filledCount++;

            // Contact (4)
            if (profile.contactInfo?.phone) filledCount++;
            if (profile.contactInfo?.currentAddress) filledCount++;
            if (profile.contactInfo?.permanentAddress) filledCount++;
            if (profile.contactInfo?.email) filledCount++;

            // Govt / Passport (5)
            if (profile.govtIdInfo?.aadhaarNumber) filledCount++;
            if (profile.govtIdInfo?.panNumber) filledCount++;
            if (profile.passportInfo?.passportNumber) filledCount++;
            if (profile.passportInfo?.expiryDate) filledCount++;
            if (profile.passportInfo?.placeOfIssue) filledCount++;

            // Emergency (3)
            if (profile.emergencyContact?.name) filledCount++;
            if (profile.emergencyContact?.phone) filledCount++;
            if (profile.emergencyContact?.relationship) filledCount++;

            // Uploads (5)
            if (profile.uploads?.profilePhoto) filledCount++;
            if (profile.uploads?.digitalSignature) filledCount++;
            if (profile.uploads?.['Aadhar Card']) filledCount++;
            if (profile.uploads?.['Address Proof']) filledCount++;
            if (profile.uploads?.['Birth Certificate']) filledCount++;

            const totalCount = 25; // Strict 100% target
            data.completionPercentage = Math.min(Math.round((filledCount / totalCount) * 100), 100);
        } else {
            data.completionPercentage = 0;
        }

        res.status(200).json({ success: true, data });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create or update user profile
// @route   PUT https://passport-ia5r.onrender.com/api/profile/update
// @access  Private
exports.updateProfile = async (req, res) => {
    const {
        fullName,
        fatherName,
        motherName,
        gender,
        dateOfBirth,
        placeOfBirth,
        nationality,
        maritalStatus,
        email,
        phone,
        currentAddress,
        permanentAddress,
        passportNumber,
        issueDate,
        expiryDate,
        placeOfIssue,
        passportType,
        aadhaarNumber,
        panNumber,
        emergencyContactName,
        emergencyContactRelation,
        emergencyContactPhone,
        destinationCountry,
        visaType,
        purposeOfVisit,
        travelDate,
        durationOfStay,
        isSubmitted
    } = req.body;

    // Helper to avoid empty string unique constraint issues
    const clean = (val) => (val === "" || val === null) ? undefined : val;

    try {
        let profile = await Profile.findOne({ user: req.user.id });

        // If profile exists and is already submitted, prevent any changes
        if (profile && profile.status && profile.status.isSubmitted) {
            return res.status(403).json({ success: false, message: 'Submitted profiles cannot be edited.' });
        }

        // Build profile object with cleaned fields
        const profileFields = {};
        profileFields.user = req.user.id;
        profileFields.personalInfo = {
            fullName: clean(fullName),
            fatherName: clean(fatherName),
            motherName: clean(motherName),
            gender: clean(gender),
            dateOfBirth: clean(dateOfBirth),
            placeOfBirth: clean(placeOfBirth),
            nationality: clean(nationality),
            maritalStatus: clean(maritalStatus)
        };
        profileFields.contactInfo = {
            email: clean(email),
            phone: clean(phone),
            currentAddress: clean(currentAddress),
            permanentAddress: clean(permanentAddress)
        };
        profileFields.passportInfo = {
            passportNumber: clean(passportNumber),
            issueDate: clean(issueDate),
            expiryDate: clean(expiryDate),
            placeOfIssue: clean(placeOfIssue),
            passportType: clean(passportType)
        };
        profileFields.govtIdInfo = {
            aadhaarNumber: clean(aadhaarNumber),
            panNumber: clean(panNumber)
        };
        profileFields.emergencyContact = {
            name: clean(emergencyContactName),
            relationship: clean(emergencyContactRelation),
            phone: clean(emergencyContactPhone)
        };

        if (destinationCountry) {
            profileFields.travelDetails = { destinationCountry, visaType, purposeOfVisit, travelDate, durationOfStay };
        }

        profileFields.status = {
            isCompleted: true,
            isSubmitted: isSubmitted || false, // Set based on user action
            verificationStatus: 'Pending'
        };

        if (profile) {
            // Update
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true }
            );
            return res.json({ success: true, data: profile, message: isSubmitted ? 'Profile submitted successfully!' : 'Draft saved successfully' });
        }

        // Create
        profile = new Profile(profileFields);
        await profile.save();
        res.json({ success: true, data: profile, message: isSubmitted ? 'Profile submitted successfully!' : 'Profile created' });

    } catch (err) {
        console.error('[PROFILE] Update Error:', err.message);
        // Distinguish between validation errors and real server errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
        }
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Duplicate value found for Identity/Passport number' });
        }
        res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
    }
};

// @desc    Upload Profile Photo
// @route   POST https://passport-ia5r.onrender.com/api/profile/upload-photo
// @access  Private
exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        // Normalize path for Windows/Unix compatibility
        const photoPath = '/' + req.file.path.replace(/\\/g, "/");

        let profile = await Profile.findOne({ user: req.user.id });


        if (profile) {
            profile.uploads = profile.uploads || {};
            profile.uploads.profilePhoto = photoPath;
            profile.markModified('uploads');
            await profile.save();
        } else {
            // Create minimal profile if doesn't exist
            profile = new Profile({
                user: req.user.id,
                uploads: { profilePhoto: photoPath },
                personalInfo: { fullName: req.user.fullName } // Use user name as placeholder
            });
            await profile.save();
        }

        res.json({ success: true, data: profile.uploads.profilePhoto });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Upload Digital Signature
// @route   POST https://passport-ia5r.onrender.com/api/profile/upload-signature
// @access  Private
exports.uploadSignature = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        const signaturePath = '/' + req.file.path.replace(/\\/g, "/");

        let profile = await Profile.findOne({ user: req.user.id });


        if (profile) {
            profile.uploads = profile.uploads || {};
            profile.uploads.digitalSignature = signaturePath;
            profile.markModified('uploads');
            await profile.save();
        } else {
            profile = new Profile({
                user: req.user.id,
                uploads: { digitalSignature: signaturePath },
                personalInfo: { fullName: req.user.fullName }
            });
            await profile.save();
        }
        res.json({ success: true, data: signaturePath });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Upload Generic Document
// @route   POST https://passport-ia5r.onrender.com/api/profile/upload-document
// @access  Private
exports.uploadDocument = async (req, res) => {
    try {
        const { fieldName } = req.body;
        if (!req.file || !fieldName) {
            return res.status(400).json({ success: false, message: 'Please upload a file and specify the field' });
        }

        const filePath = '/' + req.file.path.replace(/\\/g, "/");
        let profile = await Profile.findOne({ user: req.user.id });


        if (profile) {
            profile.uploads = profile.uploads || {};
            profile.uploads[fieldName] = filePath; // e.g. eAadhaar, originalLc, etc.
            profile.markModified('uploads'); // Required for Mixed type
            await profile.save();
        } else {
            profile = new Profile({
                user: req.user.id,
                uploads: { [fieldName]: filePath },
                personalInfo: { fullName: req.user.fullName }
            });
            await profile.save();
        }
        res.json({ success: true, data: filePath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Verify User Profile (Admin only)
// @route   PUT https://passport-ia5r.onrender.com/api/profile/admin/verify/:userId
// @access  Private/Admin
exports.verifyProfile = async (req, res) => {
    try {
        const { status } = req.body; // 'Verified' or 'Rejected'

        if (!['Verified', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        let profile = await Profile.findOne({ user: req.params.userId });

        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        profile.status.verificationStatus = status;
        await profile.save();

        res.json({ success: true, data: profile, message: `Profile marked as ${status}` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
