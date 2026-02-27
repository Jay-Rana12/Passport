const mongoose = require('mongoose');

const VisaApplicationSchema = new mongoose.Schema({
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
    visaType: {
        type: String,
        enum: ['Tourist', 'Student', 'Work', 'Business', 'Family'],
        required: true
    },
    applicantDetails: {
        givenName: String,
        surname: String,
        dob: Date,
        gender: { type: String, enum: ['Male', 'Female', 'Other'] },
        nationality: String,
        maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'] },
        nationalId: String
    },
    employmentDetails: {
        occupation: String,
        employerName: String,
        employerAddress: String,
        monthlyIncome: String
    },
    currentAddress: {
        houseNo: String,
        street: String,
        city: String,
        state: String,
        country: String,
        pincode: String,
        mobileNumber: String,
        email: String
    },
    travelDetails: {
        destinationCountry: String,
        travelDate: Date,
        returnDate: Date,
        durationOfStay: String,
        purposeOfVisit: String
    },
    passportDetails: {
        passportNumber: String,
        issueDate: Date,
        expiryDate: Date,
        issuingAuthority: String
    },
    sponsorDetails: {
        name: String,
        relationship: String,
        contactNumber: String,
        address: String
    },
    travelHistory: {
        hasTraveledBefore: { type: String, enum: ['Yes', 'No'], default: 'No' },
        previousCountriesMentioned: String
    },
    declaration: {
        isAccepted: { type: Boolean, default: false }
    },
    documents: {
        type: Map,
        of: String // Store file URLs indexed by document type
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
        type: String // URL of the generated PDF
    }
}, { timestamps: true });

// Pre-save hook for calculating progress percentage
VisaApplicationSchema.pre('save', function (next) {
    if (this.status === 'Draft' || this.status === 'Pending') {
        let filledCount = 0;
        let totalCount = 18; // Approximate main fields

        if (this.applicantDetails?.givenName) filledCount++;
        if (this.applicantDetails?.dob) filledCount++;
        if (this.applicantDetails?.nationality) filledCount++;
        if (this.currentAddress?.city) filledCount++;
        if (this.travelDetails?.destinationCountry) filledCount++;
        if (this.travelDetails?.travelDate) filledCount++;
        if (this.travelDetails?.durationOfStay) filledCount++;
        if (this.travelDetails?.purposeOfVisit) filledCount++;
        if (this.passportDetails?.passportNumber) filledCount++;
        if (this.passportDetails?.issueDate) filledCount++;
        if (this.passportDetails?.expiryDate) filledCount++;
        if (this.sponsorDetails?.name) filledCount++;
        if (this.travelHistory?.hasTraveledBefore) filledCount++;
        if (this.declaration?.isAccepted) filledCount++;
        if (this.documents && Object.keys(this.documents).length > 0) filledCount += 4; // simplified approx

        this.progressPercentage = Math.min(Math.round((filledCount / totalCount) * 100), 100);
    }
    next();
});

module.exports = mongoose.model('VisaApplication', VisaApplicationSchema);
