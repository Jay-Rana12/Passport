const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// @route   GET https://passport-ia5r.onrender.com/api/profile/me
// @desc    Get current user profile
router.get('/me', protect, profileController.getProfile);

// @route   PUT https://passport-ia5r.onrender.com/api/profile/update
// @desc    Create or update current user profile
router.put('/update', [protect, [
    // Add express-validator checks here if needed, keeping it simple for now
]], profileController.updateProfile);

// @route   POST https://passport-ia5r.onrender.com/api/profile/upload-photo
// @desc    Upload profile photo
router.post('/upload-photo', protect, upload.single('profilePhoto'), profileController.uploadProfilePhoto);

// @route   POST https://passport-ia5r.onrender.com/api/profile/upload-signature
// @desc    Upload digital signature
router.post('/upload-signature', protect, upload.single('digitalSignature'), profileController.uploadSignature);

// @route   POST https://passport-ia5r.onrender.com/api/profile/upload-document
// @desc    Upload other documents
router.post('/upload-document', protect, upload.single('document'), profileController.uploadDocument);

// @route   PUT https://passport-ia5r.onrender.com/api/profile/admin/verify/:userId
// @desc    Verify user profile (Admin only)
router.put('/admin/verify/:userId', protect, admin, profileController.verifyProfile);

module.exports = router;

