const PassportApplication = require('../models/PassportApplication');
const StatusHistory = require('../models/StatusHistory');
const Profile = require('../models/Profile');
const { generatePassportPDF } = require('../utils/pdfGenerator');
const sendEmail = require('../utils/sendEmail');

// Generate 8-character numeric/alphanumeric Application ID
const generateApplicationId = (typeCode = '') => {
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let rand = '';
    for (let i = 0; i < 8; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return rand;
};

// @desc    Create new Passport Application
// @route   POST https://passport-ia5r.onrender.com/api/passport/create
// @access  Private
exports.createPassportApplication = async (req, res) => {
    try {
        const {
            passportType,
            applicantDetails,
            familyDetails,
            presentAddress,
            emergencyContact,
            previousPassportDetails,
            policeVerification,
            declaration,
            status
        } = req.body;

        const dataPayload = {
            user: req.user.id,
            passportType: passportType || 'New',
            applicantDetails,
            familyDetails,
            presentAddress,
            emergencyContact,
            previousPassportDetails,
            policeVerification,
            declaration,
            status: status || 'Draft'
        };

        if (status === 'Submitted') {
            dataPayload.submissionDate = Date.now();
        }

        // Find existing draft
        let passApp = await PassportApplication.findOne({ user: req.user.id, status: 'Draft', passportType: dataPayload.passportType });

        if (passApp) {
            Object.assign(passApp, dataPayload);
            await passApp.save();
        } else {
            // Generate Application ID immediately
            dataPayload.applicationId = generateApplicationId();
            passApp = await PassportApplication.create(dataPayload);
        }

        // If user submitted
        if (passApp.status === 'Submitted') {
            await StatusHistory.create({
                applicationId: passApp._id,
                applicationModel: 'PassportApplication',
                oldStatus: 'Draft',
                newStatus: 'Submitted',
                changedBy: req.user.id,
                comment: `Application submitted with Application Number: ${passApp.applicationId}`
            });

            // Trigger Async PDF & Email
            (async () => {
                try {
                    const userProfile = await Profile.findOne({ user: req.user.id });
                    const pdfResult = await generatePassportPDF(passApp, req.user, userProfile);

                    passApp.pdfUrl = pdfResult.relativePath;
                    await passApp.save();

                    await sendEmail({
                        email: req.user.email,
                        subject: `Your Passport Application - ${passApp.applicationId}`,
                        message: `Dear ${req.user.fullName},\n\nYour application for ${passApp.passportType} Passport has been submitted.\nApplication Number: ${passApp.applicationId}.\n\nPlease find the PDF receipt attached.\n\nThank you,\nBorderBridge Team`,
                        attachments: [
                            {
                                filename: pdfResult.fileName,
                                path: pdfResult.filePath,
                                contentType: 'application/pdf'
                            }
                        ]
                    });

                    // Send Email to Admin
                    await sendEmail({
                        email: 'j.r818430@gmail.com',
                        subject: `NEW PASSPORT APPLICATION - ${passApp.applicationId} - ${req.user.fullName}`,
                        message: `A new passport application has been submitted.\n\nApplicant: ${req.user.fullName}\nEmail: ${req.user.email}\nApplication ID: ${passApp.applicationId}\nPassport Type: ${passApp.passportType}\n\nPlease review the application in the admin panel.`,
                        attachments: [
                            {
                                filename: pdfResult.fileName,
                                path: pdfResult.filePath,
                                contentType: 'application/pdf'
                            }
                        ]
                    });
                    console.log(`[SYS] Passport App Submitted & Email Sent -> ${passApp.applicationId}`);
                } catch (e) {
                    console.error('[SYS] PDF/Email Failed during submission', e);
                }
            })();
        }

        res.status(201).json({
            success: true,
            data: passApp,
            message: passApp.status === 'Submitted' ? 'Application submitted successfully.' : 'Draft saved successfully.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all passport applications for logged in user
// @route   GET https://passport-ia5r.onrender.com/api/passport/my
// @access  Private
exports.getMyPassportApplications = async (req, res) => {
    try {
        const applications = await PassportApplication.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .populate('documents');

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

