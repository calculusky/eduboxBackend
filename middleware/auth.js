const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { registrationEmail } = require('../utils/support');
const { transporter, generateCode, throwError } = require('../utils/helper');

//check if user's account is inactive when re-registering and send verification email
exports.checkUnverifiedEmail = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email, status: 'inactive' });
        if (user) {
            const userPayload = {
                _id: user._doc._id,
                fullName: user._doc.fullName,
                email: user._doc.email,
                educationLevel: user._doc.educationLevel,
                institution: user._doc.institution
            }
            const token = jwt.sign(userPayload, process.env.JWT_SIGN_KEY)
            const emailVerificationCode = generateCode();
            user.emailVerificationCode = emailVerificationCode;
            await user.save();

            //resend the confirmation mail to the user
            const registrationEmailVariables = {
                email: user.email,
                name: user.fullName,
                code: emailVerificationCode
            }
            const mailOPts = registrationEmail(registrationEmailVariables);
            const name = user.fullName.split(' ')[0];
            res.status(200).json({ message: `Dear ${name}, we just sent an email verification code to your email, ${user.email}.`, token: token })
            await transporter().sendMail(mailOPts);

            return;
        }
        return next();
        
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.checkPermission = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    try {
        if(!authHeader){
            throwError({ 
                message: ['Not authorized'], 
                status: 403, 
                detail: 'Token not found. Make sure a token is included in the header',
            });
        }
       
        //retrieve token
        const token = authHeader.split(' ')[1];

        //check if the token corresponds with the one stored in the database ----security measures ----
        const isTokenStored = await User.findOne({loginTokens: token});
        if(!isTokenStored){
            throwError({ 
                message: ['Not authorized.'],
                detail: 'Access denied. Token does not exist', 
                status: 403
            });
        }
        const decodedUser = await jwt.verify(token, process.env.JWT_SIGN_KEY);
        //console.log(decodedUser, 'decUser')
        if(!decodedUser){
            throwError({ 
                message: ['Authentication failed.'],
                detail: 'Verification of jwt token failed. Try again', 
                status: 500, 
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
        next(error)
    }
}

