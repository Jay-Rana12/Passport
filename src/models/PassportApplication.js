const mongoose = require('mongoose');

const PassportApplicationSchema = new mongoose.Schema({
    applicationId: {
        type: String,
        unique: true,
        sparse: true 
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    passportType: {
        type: String,
        enum: ['New', 'Renewal', 'Tatkal', 'Correction', 'Lost/Reissue', 'Minor'],
        required: true
    },
    applicantDetails: {
        givenName: String,
        surname: String,
        dob: Date,
        placeOfBirth: String,
        birthDistrict: String,
        birthState: String,
        gender: { type: String, enum: ['Male', 'Female', 'Other'] },
        maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'] },
        nationality: String,
        citizenshipBy: { type: String, enum: ['Birth', 'Descent', 'Registration', 'Naturalization'], default: 'Birth' },
        employmentType: String,
        educationalQualification: String,
        aadhaarNumber: String,
        panNumber: String,
        voterId: String,
        visibleMark: String
    },
    familyDetails: {
        fatherName: String,
        fatherNationality: String,
        motherName: String,
        motherNationality: String,
        spouseName: String,
        spouseNationality: String,
        legalGuardianName: String // Added for Minor
    },
    presentAddress: {
        houseNo: String,
        street: String,
        villageTownCity: String,
        state: String,
        district: String,
        policeStation: String,
        pincode: String,
        mobileNumber: String,
        email: String
    },
    permanentAddress: { // Added
        street: String,
        villageTownCity: String,
        state: String,
        district: String,
        pincode: String
    },
    emergencyContact: {
        name: String,
        address: String,
        mobileNumber: String,
        email: String
    },
    previousPassportDetails: {
        oldPassportNumber: String,
        issueDate: Date,
        expiryDate: Date,
        placeOfIssue: String,
        bookletType: { type: String, enum: ['36 Pages', '60 Pages'] }
    },
    renewalDetails: { // Added
        reason: { type: String, enum: ['Expired', 'Pages Exhausted', 'Damaged', 'Validity Ending', 'Other'] },
        updateRequired: [String] // Address Change, Marital Status Change, etc.
    },
    correctionDetails: { // Added
        correctionType: [String], // Name, DOB, Address, etc.
        details: String
    },
    lostDetails: { // Added
        firNumber: String,
        firDate: Date,
        lossLocation: String,
        lossDetails: String
    },
    minorDetails: { // Added
        schoolId: String,
        fatherConsent: { type: Boolean, default: false },
        motherConsent: { type: Boolean, default: false }
    },
    policeVerification: {
        nearestPoliceStation: String,
        isRequired: { type: String, enum: ['Yes', 'No'], default: 'Yes' }
    },
    declaration: {
        isAccepted: { type: Boolean, default: false }
    },
    documents: {
        type: Map,
        of: String 
    },
    progressPercentage: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Draft', 'Pending', 'Processing', 'Submitted', 'Approved', 'Rejected'],
        default: 'Draft'
    },
    submissionDate: {
        type: Date
    },
    pdfUrl: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('PassportApplication', PassportApplicationSchema);
