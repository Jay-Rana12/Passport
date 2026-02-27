const mongoose = require('mongoose');

const PassportApplicationSchema = new mongoose.Schema({
    applicationId: {
        type: String,
        unique: true,
        sparse: true // Only required when submitting
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    passportType: {
        type: String,
        enum: ['New', 'Renewal', 'Tatkal', 'Correction'],
        required: true
    },
    applicantDetails: {
        givenName: String,
        surname: String,
        dob: Date,
        placeOfBirth: String,
        gender: { type: String, enum: ['Male', 'Female', 'Other'] },
        maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'] },
        employmentType: String,
        educationalQualification: String,
        aadhaarNumber: String,
        panNumber: String,
        voterId: String
    },
    familyDetails: {
        fatherName: String,
        fatherNationality: String,
        motherName: String,
        motherNationality: String,
        spouseName: String,
        spouseNationality: String
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
        placeOfIssue: String
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
        of: String // Custom map of document type -> URL
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

// Pre-save hook for calculating progress percentage
PassportApplicationSchema.pre('save', function (next) {
    if (this.status === 'Draft' || this.status === 'Pending') {
        let filledCount = 0;
        let totalCount = 10; // approximate

        if (this.passportType) filledCount++;
        if (this.applicantDetails?.givenName) filledCount++;
        if (this.applicantDetails?.dob) filledCount++;
        if (this.familyDetails?.fatherName) filledCount++;
        if (this.presentAddress?.houseNo) filledCount++;
        if (this.presentAddress?.pincode) filledCount++;
        if (this.emergencyContact?.name) filledCount++;

        if (this.policeVerification?.nearestPoliceStation) filledCount++;
        if (this.declaration?.isAccepted) filledCount++;
        if (this.passportType === 'Renewal') {
            totalCount += 3;
            if (this.previousPassportDetails?.oldPassportNumber) filledCount++;
            if (this.previousPassportDetails?.issueDate) filledCount++;
            if (this.previousPassportDetails?.expiryDate) filledCount++;
        }
        if (this.documents && Object.keys(this.documents).length > 0) filledCount += 3;

        this.progressPercentage = Math.min(Math.round((filledCount / totalCount) * 100), 100);
    }
    next();
});

module.exports = mongoose.model('PassportApplication', PassportApplicationSchema);
