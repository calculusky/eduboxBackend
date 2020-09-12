const express = require('express');
const router = express.Router();
const {
    resendRegistrationMail
} = require('../middleware/auth');

const {
    postSignup,
    postVerifyEmail,
    postResendEmailVerificationCode
} = require('../controllers/auth');

const {
    getPassportAuthGoogleSuccess,
    getPassportAuthGoogleProfile,
    getPassportAuthGoogleFailure,
} = require('../controllers/passportAuth');


router.post('/signup', resendRegistrationMail, postSignup);
router.post('/verifyemail', postVerifyEmail);
router.post('/resendverificationemail', postResendEmailVerificationCode);
router.get('/google', getPassportAuthGoogleProfile);
router.get('/google/callback', getPassportAuthGoogleFailure, getPassportAuthGoogleSuccess)

module.exports = router;