const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    documentType: {
        type: String,
        enum: [
            'Passport Copy',
            'Bank Statement',
            'Photograph',
            'Signature',
            'Offer Letter',
            'Invitation Letter',
            'Other'
        ],
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
