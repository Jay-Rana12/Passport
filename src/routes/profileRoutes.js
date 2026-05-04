const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// @route   GET /api/profile/me
// @desc    Get current user profile
router.get('/me', protect, profileController.getProfile);

// @route   PUT /api/profile/update
// @desc    Create or update current user profile
router.put('/update', [protect, [
    // Add express-validator checks here if needed, keeping it simple for now
]], profileController.updateProfile);

// @route   POST /api/profile/photo
// @desc    Upload profile photo
router.post('/photo', protect, upload.single('photo'), profileController.uploadProfilePhoto);

// @route   POST /api/profile/upload-signature
// @desc    Upload digital signature
router.post('/upload-signature', protect, upload.single('digitalSignature'), profileController.uploadSignature);

// @route   POST /api/profile/upload-document
// @desc    Upload other documents
router.post('/upload-document', protect, upload.single('document'), profileController.uploadDocument);

// @route   DELETE /api/profile/document/:fieldName
// @desc    Delete document from vault
router.delete('/document/:fieldName', protect, profileController.deleteDocument);

// @route   PUT /api/profile/admin/verify/:userId
// @desc    Verify user profile (Admin only)
router.put('/admin/verify/:userId', protect, admin, profileController.verifyProfile);

// @route   POST /api/profile/verify-aadhaar
// @desc    Verify Aadhaar number
router.post('/verify-aadhaar', protect, profileController.verifyAadhaar);

module.exports = router;

