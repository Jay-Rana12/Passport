const express = require('express');
const router = express.Router();
const VisaApplication = require('../models/VisaApplication');
const PassportApplication = require('../models/PassportApplication');
const { generateVisaPDF, generatePassportPDF } = require('../utils/pdfGenerator');
const User = require('../models/User');
const Profile = require('../models/Profile');

// @desc    Track application status
// @route   GET /api/public/track/:appId
// @access  Public
router.get('/track/:appId', async (req, res) => {
    try {
        const appId = req.params.appId.toUpperCase();
        let app = await VisaApplication.findOne({ applicationId: appId }).select('applicationId visaType status createdAt');
        if (!app) {
            app = await PassportApplication.findOne({ applicationId: appId }).select('applicationId passportType status createdAt');
        }
        if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
        res.status(200).json({ success: true, data: app });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc    Download Receipt on-the-fly (Fixes Render Ephemeral Issue)
// @route   GET /api/public/receipt/:type/:id
router.get('/receipt/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        let app;
        let pdfResult;

        if (type.toLowerCase() === 'visa') {
            app = await VisaApplication.findById(id).populate('user');
            if (!app) return res.status(404).send('Application not found');
            const profile = await Profile.findOne({ user: app.user?._id });
            pdfResult = await generateVisaPDF(app, app.user, profile);
        } else {
            app = await PassportApplication.findById(id).populate('user');
            if (!app) return res.status(404).send('Application not found');
            const profile = await Profile.findOne({ user: app.user?._id });
            pdfResult = await generatePassportPDF(app, app.user, profile);
        }

        res.download(pdfResult.filePath, pdfResult.fileName);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating receipt');
    }
});

module.exports = router;
