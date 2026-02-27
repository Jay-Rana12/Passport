const mongoose = require('mongoose');

const StatusHistorySchema = new mongoose.Schema({
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'applicationModel'
    },
    applicationModel: {
        type: String,
        required: true,
        enum: ['VisaApplication', 'PassportApplication']
    },
    oldStatus: {
        type: String,
        required: true
    },
    newStatus: {
        type: String,
        required: true
    },
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comment: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('StatusHistory', StatusHistorySchema);
