const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    personalInfo: {
        fullName: { type: String, required: function () { return this.status && this.status.isSubmitted; } },
        gender: { type: String, enum: ['Male', 'Female', 'Other'] },
        dateOfBirth: { type: Date },
        placeOfBirth: { type: String },
        nationality: { type: String },
        maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
        fatherName: { type: String },
        motherName: { type: String }
    },
    contactInfo: {
        email: { type: String },
        phone: { type: String },
        currentAddress: { type: String },
        permanentAddress: { type: String }
    },
    passportInfo: {
        passportNumber: { type: String, unique: true, sparse: true },
        issueDate: { type: Date },
        expiryDate: { type: Date },
        placeOfIssue: { type: String },
        passportType: { type: String, enum: ['Normal', 'Diplomatic', 'Official', 'Tatkal'], default: 'Normal' }
    },
    govtIdInfo: {
        aadhaarNumber: { type: String, unique: true, sparse: true },
        panNumber: { type: String }
    },
    emergencyContact: {
        name: { type: String },
        relationship: { type: String },
        phone: { type: String }
    },
    travelDetails: {
        destinationCountry: { type: String },
        visaType: { type: String },
        purposeOfVisit: { type: String },
        travelDate: { type: Date },
        durationOfStay: { type: String }
    },
    uploads: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    status: {
        isCompleted: { type: Boolean, default: false },
        isSubmitted: { type: Boolean, default: false },
        verificationStatus: {
            type: String,
            enum: ['Pending', 'Verified', 'Rejected'],
            default: 'Pending'
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Profile', ProfileSchema);

