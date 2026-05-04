const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getAllApplications,
    updateApplicationStatus,
    verifyProfile,
    resendAllReceipts
} = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/users', protect, admin, getAllUsers);
router.get('/applications', protect, admin, getAllApplications);
router.put('/application/status/:id', protect, admin, updateApplicationStatus);
router.put('/profile/verify/:userId', protect, admin, verifyProfile);
router.post('/resend-all-receipts', protect, admin, resendAllReceipts);

module.exports = router;

