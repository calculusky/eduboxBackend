const express = require('express');
const router = express.Router()

const { signup } = require('../controllers/auth');

const { 
        passportAuthGoogleSuccess,
        passportAuthGoogleProfile,
        passportAuthGoogleFailure,        
       } = require('../controllers/passportAuth');


router.post('/signup', signup);
router.get('/google', passportAuthGoogleProfile);
router.get('/google/callback', passportAuthGoogleFailure, passportAuthGoogleSuccess)

module.exports = router;
