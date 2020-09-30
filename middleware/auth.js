const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { registrationEmail } = require('../utils/support');
const { transporter, generateCode, throwError } = require('../utils/helper');

exports.resendRegistrationMail = async(req, res, next) => {
    const user = await User.findOne({ email: req.body.email, status: 'inactive' });
    if (user) {
        const userPayload = {
            ...user._doc,
            password: undefined,
            emailVerificationCode: undefined
        }
        const token = await jwt.sign(userPayload, process.env.JWT_SIGN_KEY)
        const emailVerificationCode = generateCode();
        user.emailVerificationCode = emailVerificationCode;
        await user.save();

        //resend the confirmation mail to the user
        const registrationEmailVariables = {
            email: user.email,
            name: user.firstname,
            code: emailVerificationCode
        }
        const mailOPts = registrationEmail(registrationEmailVariables);
        res.status(200).json({ message: `Dear ${user.firstname}, your email, ${user.email} has not been verified, we have sent a verification code to your email`, token: token })
        await transporter().sendMail(mailOPts);

        return;
    }
    return next();
}

exports.checkPermission = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    try {
        if(!authHeader){
            throwError({ 
                message: 'Not authorized', 
                status: 401, 
                detail: 'Token not found. Make sure a token is included in the header',
                validationErrors: null
            });
        }
       
        //retrieve token
        const token = authHeader.split(' ')[1];

        //check if the token corresponds with the one stored in the database ----security measures ----
        const isTokenStored = await User.findOne({loginTokens: token});
        if(!isTokenStored){
            throwError({ 
                message: 'Not authorized.',
                detail: 'Access denied. Token does not exist', 
                status: 401, 
                validationErrors: null
            });
        }
        const decodedUser = await jwt.verify(token, process.env.JWT_SIGN_KEY);
        //console.log(decodedUser, 'decUser')
        if(!decodedUser){
            throwError({ 
                message: 'Authentication failed.',
                detail: 'Verification of jwt token failed. Try again', 
                status: 500, 
                validationErrors: null
            });
        }
        
        //store the user ID in the request body 
        req.userId = decodedUser._id;
        return next();
    } catch (error) {
        if(error.message === 'jwt expired'){
            error.detail = 'Access denied due to expired jwt token';
            error.status = 401;
        }
        if(error.message === 'invalid token'){
            error.detail = 'Access denied due to invalid jwt token';
            error.status = 401;
        }       
        console.log(error)
        next(error)
    }
}