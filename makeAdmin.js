require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/borderbridge';

mongoose.connect(MONGO_URI).then(async () => {
    let user = await User.findOne();
    if (user) {
        user.role = 'admin';
        await user.save();
        console.log(`User ${user.email} is now an ADMiN! Start testing with this email`);
    } else {
        console.log('No user registered yet.');
    }
    process.exit(0);
});
