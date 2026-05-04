const PassportApplication = require('../models/PassportApplication');
const fs = require('fs');
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
                nationality: d.nationality || 'Indian',
                employmentType: d.employmentType,
                educationalQualification: d.educationalQualification,
                aadhaarNumber: d.aadhaarNumber,
                panNumber: d.panNumber,
                voterId: d.voterId
            },
            familyDetails: {
                fatherName: d.fatherName,
                motherName: d.motherName,
                legalGuardianName: d.legalGuardianName,
                spouseName: d.spouseName
            },
            presentAddress: {
                street: d.street,
                villageTownCity: d.city || d.district,
                state: d.state,
                district: d.district,
                policeStation: d.policeStation,
                pincode: d.pincode,
                mobileNumber: d.mobileNumber,
                email: d.email
            },
            permanentAddress: {
                street: d.permanentAddress || d.street,
                state: d.state,
                district: d.district,
                pincode: d.pincode
            },
            emergencyContact: {
                name: d.eName,
                mobileNumber: d.eMobile,
                address: d.eAddress || d.street
            },
            previousPassportDetails: {
                oldPassportNumber: d.oldPassportNumber,
                issueDate: d.issueDate,
                expiryDate: d.expiryDate,
                placeOfIssue: d.placeOfIssue
            },
            renewalDetails: {
                reason: d.renewalReason,
                updateRequired: Array.isArray(d.updateRequired) ? d.updateRequired : (d.updateRequired ? [d.updateRequired] : [])
            },
            correctionDetails: {
                correctionType: Array.isArray(d.correctionType) ? d.correctionType : (d.correctionType ? [d.correctionType] : []),
                details: d.correctionDetails
            },
            lostDetails: {
                firNumber: d.firNumber,
                firDate: d.firDate,
                lossLocation: d.lossLocation,
                lossDetails: d.lossDetails
            },
            minorDetails: {
                schoolId: d.schoolId,
                fatherConsent: d.fatherConsent === 'true' || d.fatherConsent === true,
                motherConsent: d.motherConsent === 'true' || d.motherConsent === true
            },
            declaration: { isAccepted: true },
            status: 'Submitted', // Default to submitted for the new flow
            documents: {}
        };

        // Handle uploaded files
        const fileFields = ['applicantPhoto', 'applicantSignature', 'aadhaarDoc', 'birthProof', 'educationProof', 'addressProof', 'oldPassportDoc', 'firDoc'];
        fileFields.forEach(field => {
            if (files[field]) {
                dataPayload.documents[field] = '/' + files[field][0].path.replace(/\\/g, "/");
            }
        });

        dataPayload.submissionDate = Date.now();
        dataPayload.applicationId = generateApplicationId();
        
        const passApp = await PassportApplication.create(dataPayload);

        // Record Status History
        await StatusHistory.create({
            applicationId: passApp._id,
            applicationModel: 'PassportApplication',
            oldStatus: 'Draft',
            newStatus: 'Submitted',
            changedBy: req.user.id,
            comment: `New Passport Application Created: ${passApp.applicationId}`
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
            } catch (e) {
                console.error('[SYS] PDF/Email Failed during submission', e);
            }
        })();

        res.status(201).json({
            success: true,
            data: passApp,
            message: 'Application submitted successfully.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all passport applications for logged in user
exports.getMyPassportApplications = async (req, res) => {
    try {
        const applications = await PassportApplication.find({ user: req.user.id })
            .sort({ createdAt: -1 });

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
