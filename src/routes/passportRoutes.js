const express = require('express');
const router = express.Router();
const {
    createPassportApplication,
    getMyPassportApplications
} = require('../controllers/passportController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/create', protect, createPassportApplication);
router.get('/my', protect, getMyPassportApplications);

module.exports = router;
