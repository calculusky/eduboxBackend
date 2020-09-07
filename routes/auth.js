const express = require('express');
const router = express.Router()

const { 
       postSignup, 
       getVerifyAccount, 
       postResendEmailVerificationCode
      } = require('../controllers/auth');

const { 
        getPassportAuthGoogleSuccess,
        getPassportAuthGoogleProfile,
        getPassportAuthGoogleFailure,        
       } = require('../controllers/passportAuth');


router.post('/signup', postSignup);
router.get('/verifyemail', getVerifyAccount);
router.post('/resendverificationemail', postResendEmailVerificationCode);
router.get('/google', getPassportAuthGoogleProfile);
router.get('/google/callback', getPassportAuthGoogleFailure, getPassportAuthGoogleSuccess)

module.exports = router;
