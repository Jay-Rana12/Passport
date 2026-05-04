const express = require('express');
const router = express.Router();
const VisaApplication = require('../models/VisaApplication');
const PassportApplication = require('../models/PassportApplication');

// @desc    Track application status
// @route   GET /api/public/track/:appId
// @access  Public
router.get('/track/:appId', async (req, res) => {
    try {
        const appId = req.params.appId.toUpperCase();

        // Search in Visa
        let app = await VisaApplication.findOne({ applicationId: appId }).select('applicationId visaType status createdAt');
        
        // Search in Passport if not found
        if (!app) {
            app = await PassportApplication.findOne({ applicationId: appId }).select('applicationId passportType status createdAt');
        }

        if (!app) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        res.status(200).json({ success: true, data: app });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
