const VisaApplication = require('../models/VisaApplication');
const StatusHistory = require('../models/StatusHistory');
const Profile = require('../models/Profile');

const sendEmail = require('../utils/sendEmail');
const { generateVisaPDF } = require('../utils/pdfGenerator');

// Generate Unique 8-character Alphanumeric ID
const generateApplicationId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 8 char application number
    let rand = '';
    for (let i = 0; i < 8; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return rand;
};

// @desc    Create or Update Visa Application (Draft / Submit)
// @route   POST https://passport-ia5r.onrender.com/api/visa/create
// @access  Private
exports.createVisaApplication = async (req, res) => {
    try {
        const {
            visaType, applicantDetails, employmentDetails, currentAddress, travelDetails, passportDetails, sponsorDetails, travelHistory, declaration, status
        } = req.body;

        const dataPayload = {
            user: req.user.id,
            visaType: visaType || 'Tourist',
            applicantDetails,
            employmentDetails,
            currentAddress,
            travelDetails,
            passportDetails,
            sponsorDetails,
            travelHistory,
            declaration,
            status: status || 'Draft'
        };

        if (status === 'Submitted') {
            dataPayload.submissionDate = Date.now();
        }

        // We can either find an existing Draft for this user & visa type or create new
        let visaApp = await VisaApplication.findOne({ user: req.user.id, status: 'Draft', visaType: dataPayload.visaType });

        if (visaApp) {
            Object.assign(visaApp, dataPayload);
            await visaApp.save();
        } else {
            // Generate Application ID strictly on creation!
            dataPayload.applicationId = generateApplicationId();
            visaApp = await VisaApplication.create(dataPayload);
        }

        // If user submitted actually
        if (visaApp.status === 'Submitted') {
            // Log History
            await StatusHistory.create({
                applicationId: visaApp._id,
                applicationModel: 'VisaApplication',
                oldStatus: 'Draft',
                newStatus: 'Submitted',
                changedBy: req.user.id,
                comment: `Application submitted with Application Number: ${visaApp.applicationId}`
            });

            (async () => {
                try {
                    const userProfile = await Profile.findOne({ user: req.user.id });
                    const pdfResult = await generateVisaPDF(visaApp, req.user, userProfile);

                    // Update PDF URL in DB
                    visaApp.pdfUrl = pdfResult.relativePath;
                    await visaApp.save();

                    // Send Email to User
                    await sendEmail({
                        email: req.user.email, // Provided by protect middleware
                        subject: `Your ${visaApp.visaType} Visa Application - ${visaApp.applicationId}`,
                        message: `Dear ${req.user.fullName},\n\nYour application has been successfully submitted. Your Application Number is ${visaApp.applicationId}.\n\nPlease find the PDF receipt attached to this email.\n\nThank you,\nBorderBridge Team`,
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
                        subject: `NEW VISA APPLICATION - ${visaApp.applicationId} - ${req.user.fullName}`,
                        message: `A new visa application has been submitted.\n\nApplicant: ${req.user.fullName}\nEmail: ${req.user.email}\nApplication ID: ${visaApp.applicationId}\nVisa Type: ${visaApp.visaType}\n\nPlease review the application in the admin panel.`,
                        attachments: [
                            {
                                filename: pdfResult.fileName,
                                path: pdfResult.filePath,
                                contentType: 'application/pdf'
                            }
                        ]
                    });
                    console.log(`[SYS] Application Submitted & Email Sent -> ${visaApp.applicationId}`);
                } catch (e) {
                    console.error('[SYS] PDF/Email Failed during submission', e);
                }
            })();
        }

        res.status(201).json({
            success: true,
            data: visaApp,
            message: visaApp.status === 'Submitted' ? 'Application submitted successfully.' : 'Draft saved successfully.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all visa applications for logged in user
// @route   GET https://passport-ia5r.onrender.com/api/visa/my
// @access  Private
exports.getMyVisaApplications = async (req, res) => {
    try {
        const applications = await VisaApplication.find({ user: req.user.id })
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

// @desc    Get single visa application by ID
// @route   GET https://passport-ia5r.onrender.com/api/visa/:id
// @access  Private
exports.getVisaApplicationById = async (req, res) => {
    try {
        const application = await VisaApplication.findById(req.params.id)
            .populate('user', 'fullName email phone')
            .populate('documents');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Check ownership (unless admin)
        if (application.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const history = await StatusHistory.find({ applicationId: application._id })
            .sort({ createdAt: -1 })
            .populate('changedBy', 'fullName');

        res.status(200).json({
            success: true,
            data: application,
            history
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

