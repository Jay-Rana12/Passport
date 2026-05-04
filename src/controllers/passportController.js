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
// @route   POST /api/passport/create
// @access  Private
exports.createPassportApplication = async (req, res) => {
    try {
        const d = req.body;
        const files = req.files || {};

        const dataPayload = {
            user: req.user.id,
            passportType: d.passportType || 'New',
            applicantDetails: {
                givenName: d.givenName,
                surname: d.surname,
                dob: d.dob,
                placeOfBirth: d.placeOfBirth,
                gender: d.gender,
                maritalStatus: d.maritalStatus,
                educationalQualification: d.educationalQualification,
                aadhaarNumber: d.aadhaarNumber,
                panNumber: d.panNumber
            },
            familyDetails: {
                fatherName: d.fatherName,
                fatherNationality: d.fatherNationality,
                motherName: d.motherName,
                motherNationality: d.motherNationality,
                spouseName: d.spouseName
            },
            presentAddress: {
                street: d.street,
                villageTownCity: d.city,
                state: d.state,
                district: d.district,
                pincode: d.pincode,
                mobileNumber: d.mobileNumber,
                email: d.email
            },
            emergencyContact: {
                name: d.eName,
                mobileNumber: d.eMobile,
                address: d.eAddress
            },
            previousPassportDetails: d.passportType === 'Renewal' ? {
                oldPassportNumber: d.oldPassportNumber,
                issueDate: d.issueDate,
                expiryDate: d.expiryDate,
                placeOfIssue: d.placeOfIssue
            } : {},
            declaration: { isAccepted: true },
            status: d.status || 'Draft',
            documents: {}
        };

        // Handle uploaded files
        if (files.applicantPhoto) dataPayload.documents['applicantPhoto'] = '/' + files.applicantPhoto[0].path.replace(/\\/g, "/");
        if (files.applicantSignature) dataPayload.documents['applicantSignature'] = '/' + files.applicantSignature[0].path.replace(/\\/g, "/");
        if (files.aadhaarDoc) dataPayload.documents['aadhaarDoc'] = '/' + files.aadhaarDoc[0].path.replace(/\\/g, "/");
        if (files.birthProof) dataPayload.documents['birthProof'] = '/' + files.birthProof[0].path.replace(/\\/g, "/");

        if (d.status === 'Submitted') {
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
                        subject: `✅ Passport Application Received - ${passApp.applicationId}`,
                        message: `Dear ${req.user.fullName},\n\nBorderBridge Consultancy me aane ke liye aapka bahut bahut dhanyavad. Humne aapka ${passApp.passportType} Passport application successfully receive kar liya hai.\n\nApplication Number: ${passApp.applicationId}\n\nHumari team jald hi aapke documents verify karke aage ki process shuru karegi. Aapka application receipt is email ke saath attached hai.\n\nRegards,\nBorderBridge Consultancy Team`,
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
// @route   GET /api/passport/my
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

