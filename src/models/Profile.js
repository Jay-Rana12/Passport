const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    personalInfo: {
        fullName: { type: String },
        gender: { type: String, enum: ['Male', 'Female', 'Other'] },
        dateOfBirth: { type: Date },
        placeOfBirth: { type: String },
        nationality: { type: String, default: 'Indian' },
        maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'] },
        fatherName: { type: String },
        motherName: { type: String },
        occupation: { type: String },
        bloodGroup: { type: String },
        educationalQualification: { type: String }
    },
    contactInfo: {
        email: { type: String },
        phone: { type: String },
        currentAddress: {
            houseNo: String,
            street: String,
            landmark: String,
            city: String,
            state: String,
            pincode: String
        },
        permanentAddress: {
            houseNo: String,
            street: String,
            landmark: String,
            city: String,
            state: String,
            pincode: String
        }
    },
    passportInfo: {
        passportNumber: { type: String, unique: true, sparse: true },
        issueDate: { type: Date },
        expiryDate: { type: Date },
        placeOfIssue: { type: String }
    },
    govtIdInfo: {
        aadhaarNumber: { type: String, unique: true, sparse: true },
        isAadhaarVerified: { type: Boolean, default: false },
        panNumber: { type: String },
        isPanVerified: { type: Boolean, default: false },
        voterId: { type: String }
    },
    emergencyContact: {
        name: { type: String },
        relationship: { type: String },
        phone: { type: String },
        address: { type: String }
    },
    uploads: {
        type: Map,
        of: String,
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
