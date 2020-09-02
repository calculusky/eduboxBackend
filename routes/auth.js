const express = require('express');
const router = express.Router()

const { 
       postSignup, 
       getVerifiedSignupMail, 
       resendEmailVerificationCode
      } = require('../controllers/auth');

const { 
        passportAuthGoogleSuccess,
        passportAuthGoogleProfile,
        passportAuthGoogleFailure,        
       } = require('../controllers/passportAuth');


router.post('/signup', postSignup);
router.get('/verifyEmail', getVerifiedSignupMail);
router.post('/resendVerificationEmail', resendEmailVerificationCode);
router.get('/google', passportAuthGoogleProfile);
router.get('/google/callback', passportAuthGoogleFailure, passportAuthGoogleSuccess)

module.exports = router;
