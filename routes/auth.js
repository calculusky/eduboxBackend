const express = require('express');
const router = express.Router();

const {
   checkUnverifiedEmail
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


router.post('/signup', checkUnverifiedEmail, postSignup);
router.post('/verifyemail', postVerifyEmail);
router.post('/resendverificationemail', postResendEmailVerificationCode);
router.post('/forgotpassword', postForgotPassword);
router.post('/verifyresetpasswordotp', postVerifyPasswordResetOTP);
router.post('/updatepassword', postUpdatePassword);
router.post('/login', checkUnverifiedEmail, postLogin);
router.get('/google', getPassportAuthGoogleProfile);
router.get('/google/callback', getPassportAuthGoogleFailure, getPassportAuthGoogleSuccess)


module.exports = router;