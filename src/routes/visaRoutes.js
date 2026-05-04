const express = require('express');
const router = express.Router();
const {
    createVisaApplication,
    getMyVisaApplications,
    getVisaApplicationById
} = require('../controllers/visaController');
const { protect } = require('../middlewares/authMiddleware');

const upload = require('../middlewares/uploadMiddleware');

router.post('/create', protect, upload.fields([
    { name: 'applicantPhoto', maxCount: 1 },
    { name: 'applicantSignature', maxCount: 1 },
    { name: 'passportFront', maxCount: 1 },
    { name: 'passportBack', maxCount: 1 }
]), createVisaApplication);
router.get('/my', protect, getMyVisaApplications);
router.get('/:id', protect, getVisaApplicationById);

module.exports = router;

