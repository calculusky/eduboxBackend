const mongoose = require('mongoose');
const Schema =  mongoose.Schema;
const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    googleId: {
        type: String,
        //required: true
    },
    fullName: {
        type: String,
        required: true
    },
    educationLevel: {
        type: String
        //required: true
    },
    institution: {
        type: String 
        //required: true
    },
    password: {
        type: String
        //required: true
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        default: 'inactive'
    },
    emailVerificationCode: {
        type: String
    },
    loginTokens: {
        type: []
    },
    passwordResetOTP: {
        type: String
    }

})
const user = mongoose.model('User', userSchema);
module.exports = user;