const express = require('express');
const router = express.Router();
const {
    createVisaApplication,
    getMyVisaApplications,
    getVisaApplicationById
} = require('../controllers/visaController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/create', protect, createVisaApplication);
router.get('/my', protect, getMyVisaApplications);
router.get('/:id', protect, getVisaApplicationById);

module.exports = router;
