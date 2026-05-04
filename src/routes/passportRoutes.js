const express = require('express');
const router = express.Router();
const {
    createPassportApplication,
    getMyPassportApplications
} = require('../controllers/passportController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/create', protect, upload.fields([
    { name: 'applicantPhoto', maxCount: 1 },
    { name: 'applicantSignature', maxCount: 1 },
    { name: 'aadhaarDoc', maxCount: 1 },
    { name: 'birthProof', maxCount: 1 },
    { name: 'educationProof', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
    { name: 'oldPassportDoc', maxCount: 1 },
    { name: 'firDoc', maxCount: 1 }
]), createPassportApplication);

router.get('/my', protect, getMyPassportApplications);

module.exports = router;
