const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const VisaApplication = require('../src/models/VisaApplication');
const PassportApplication = require('../src/models/PassportApplication');

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const visaCount = await VisaApplication.countDocuments();
        const passCount = await PassportApplication.countDocuments();
        console.log(`Total Visa: ${visaCount}, Total Passport: ${passCount}`);

        const visaStats = await VisaApplication.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
        const passStats = await PassportApplication.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);

        console.log("Visa Statuses:", JSON.stringify(visaStats, null, 2));
        console.log("Passport Statuses:", JSON.stringify(passStats, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
