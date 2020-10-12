const express = require('express');
const router = express.Router();

const {
    resendRegistrationMail
} = require('../middleware/auth');

const {
    postSignup,
    postVerifyEmail,
    postResendEmailVerificationCode,
    postLogin,
    postForgotPassword,
    postVerifyPasswordResetOTP,
    postUpdatePassword
} = require('../controllers/auth');

const {
    getPassportAuthGoogleSuccess,
    getPassportAuthGoogleProfile,
    getPassportAuthGoogleFailure,
} = require('../controllers/passportAuth');


router.post('/signup', resendRegistrationMail, postSignup);
router.post('/verifyemail', postVerifyEmail);
router.post('/resendverificationemail', postResendEmailVerificationCode);
router.post('/forgotpassword', postForgotPassword);
router.post('/verifyresetpasswordtoken', postVerifyPasswordResetOTP);
router.post('/updatepassword', postUpdatePassword);
router.post('/login', postLogin);
router.get('/google', getPassportAuthGoogleProfile);
router.get('/google/callback', getPassportAuthGoogleFailure, getPassportAuthGoogleSuccess)


module.exports = router;