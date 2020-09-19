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
    firstname: {
        type: String,
        required: true
    },
    middlename: {
        type: String
        //required: true
    },
    lastname: {
        type: String,
        required: true
    },
    educationlevel: {
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
    status: {
        type: String,
        default: 'inactive'
    },
    emailVerificationCode: {
        type: String
    },
    loginToken: {
        type: String
    }

})
const user = mongoose.model('User', userSchema);
module.exports = user;