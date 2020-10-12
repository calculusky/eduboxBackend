const config = require('../config');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { hash, compare } = require('bcryptjs');

const { isEmail, 
        isEmpty, 
        matches, 
        isAlpha, 
        normalizeEmail } = require('validator');

const { throwError,
        passwordRegExp, 
        transporter, 
        sanitizeName, 
        generateCode, 
        verifyEmailCodeRegExp, 
        otp } = require('../utils/helper');

const { registrationEmail, 
        successfulRegistrationEmail, 
        passwordResetEmail } = require('../utils/support');


exports.postSignup = async(req, res, next) => {
    const {
        fullname,
        email,
        password,
        confirmpassword,
        institution,
        educationlevel
    } = req.body;


    //validate user input
    const errors = []
    if (!isEmail(email)) {
        errors.push({ message: 'Invalid email address' });
    }
    if (isEmpty(fullname)) {
        errors.push({ message: 'Please enter a valid name' })
    }
    if (!isAlpha(institution)) {
        errors.push({ message: 'Please enter a valid institution name' })
    }
    if (!isAlpha(educationlevel)) {
        errors.push({ message: 'Please enter a valid education level' })
    }
    if (!matches(password, passwordRegExp())) {
        errors.push({ message: 'Password must be minimum of 8 containing at least one letter, one number and special character(s) @, $, !' });
    }
    if (password !== confirmpassword) {
        errors.push({ message: 'password do not match' })
    }

    //sanitize the input
    const sanEmail = normalizeEmail(email.trim());
    const sanPassword = password.trim();
    const sanFullName = sanitizeName(fullname.trim());
    try {
        //call the error handling function and forward the validation errors to the error handling middleware
        if (errors.length > 0) {
            throwError({ 
                message: 'invalid signup input', 
                status: 422, 
                detail: 'Failed to register user due to invalid inputs. Make sure to input a valid data',
                validationErrors: errors
            });
        }

        //check if the user exists 
        const existingUser = await User.findOne({ email: sanEmail });
        if (existingUser) {
            throwError({ 
                message: 'Email already exists',
                detail: 'A user exists with the email. Please use a different email or login', 
                status: 401, 
                validationErrors: null
            });
        }

        //store the user in the db and return a token to the client  in case the user received no mail
        const emailVerificationCode = generateCode();
        const harshedPassword = await hash(sanPassword, 12);
        const newUser = {
            email: sanEmail,
            fullName: sanFullName,
            password: harshedPassword,
            institution: institution,
            educationLevel: educationlevel,
            emailVerificationCode: emailVerificationCode
        }
        const token = jwt.sign(newUser, process.env.JWT_SIGN_KEY);
        const user = new User(newUser);
        const savedUser = await user.save();
        res.status(200).json({
            message: 'Email verification sent to your email address',
            email: sanEmail,
            token: token
        });

        //send a confirmation mail to the user
        const registrationEmailVariables = {
            email: sanEmail,
            name: sanFullName,
            code: emailVerificationCode
        }
        const mailOPts = registrationEmail(registrationEmailVariables);
        await transporter().sendMail(mailOPts);

    } catch (error) {
        console.log(error, 'catch err')
        next(error)
    }
}


exports.postResendEmailVerificationCode = async (req, res, next) => {
    const token = req.body.token;
    try {
        const decodedUser = await jwt.verify(token, process.env.JWT_SIGN_KEY);
        if (!decodedUser) {
            throwError({ 
                message: 'failed to decode token', 
                detail: 'jwt decoding for user failed, try again',
                status: 401, 
                validationErrors: null
            });
        }

        //generate another code and send to the email. Also update the database 
        const emailVerificationCode = generateCode();
        const user = await User.findOne({ email: decodedUser.email });
        if (!user) {
            throwError({ 
                message: 'User not found',
                detail: 'No user associated with the email', 
                status: 404, 
                validationErrors: null
            });
        }
        user.emailVerificationCode = emailVerificationCode;
        await user.save();

        //resend the email
        const registrationEmailVariables = {
            email: decodedUser.email,
            name: decodedUser.fullName,
            code: emailVerificationCode,
        }
        const mailOPts = registrationEmail(registrationEmailVariables);
        res.status(200).json({ message: 'Email verification successfuly resent', token: token })
        await transporter().sendMail(mailOPts);


    } catch (error) {
        next(error);
    }

}

exports.postVerifyEmail = async (req, res, next) => {

    //verify new users email and activate their account
    const { code, email } = req.body;

    try {
        //sanitize and validate input
        const errors = []
        const sanCode = code.trim();
        if (!isEmail(email)) {
            errors.push({ message: 'Invalid email address' });
        }
        if (!matches(sanCode, verifyEmailCodeRegExp())) {
            errors.push({ message: 'code must be 6-digit containing only letters or numbers' })
        }
        const sanEmail = normalizeEmail(email.trim());
        if (errors.length > 0) {
            throwError({ 
                message: 'invalid verification input', 
                detail: 'Verification code or email is not valid',
                status: 422, 
                validationErrors: errors
            });
        }

        const newUser = await User.findOne({ emailVerificationCode: sanCode, email: sanEmail });
        if (!newUser) {
            throwError({ 
                message: 'Incorrect code or email', 
                detail: 'No user associated with the email or verification code',
                status: 404, 
                validationErrors: null
            });
        }
        newUser.status = 'active';
        newUser.emailVerificationCode = undefined;
        const savedUser = await newUser.save();
        const returnUser = {
            ...savedUser._doc,
            password: undefined
        }
        res.status(200).json({ message: 'Email successfully verified', user: returnUser });

        //send email
        const successfulRegistrationEmailVariables = {
            email: newUser.email,
            name: newUser.fullName
        }
        const mailOPts = successfulRegistrationEmail(successfulRegistrationEmailVariables);
        await transporter().sendMail(mailOPts);

    } catch (error) {
        next(error)
    }
}

exports.postLogin = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const errors = [];
        if(!isEmail(email)){
            errors.push({message: 'Invalid email'});
        }
        if(!matches(password, passwordRegExp())){
            errors.push({message: 'Invalid password'})
        }
        if(errors.length > 0){
        throwError({ 
            message: 'invalid inputs', 
            status: 422, 
            detail: 'failed to login due to invalid inputs',
            validationErrors: errors
        });
        }
        const sanEmail = normalizeEmail(email.trim());
        const sanPassword = password.trim();

        const user = await User.findOne({email: sanEmail});
        if(!user){
            throwError({ 
                message: 'user not found',
                detail: 'The user with the email does not exist', 
                status: 404, 
                validationErrors: null
            });
        }
        const isMatch = await compare(sanPassword, user.password);
        if(!isMatch){
            throwError({ 
                message: 'incorrect password',
                detail: 'Password entered is incorrect', 
                status: 422, 
                validationErrors: null
            });
        }
        
        //create a login token for logged in user and store in db
        const userLoginPayload = {
            _id: user._doc._id,
            fullName: user._doc.fullName,
            email: user._doc.email,
            educationLevel: user._doc.educationLevel,
            institution: user._doc.institution
        }

        const token =  jwt.sign(userLoginPayload, process.env.JWT_SIGN_KEY, { expiresIn: '4m' });

        //check if there are some expired tokens in the database and delete
        let newTokens = [];
        let oldTokens = user.loginTokens;
        let oldPayload;
       if(oldTokens.length > 0){
        for(let i=0; i<oldTokens.length; i++){
            oldPayload = await jwt.verify(oldTokens[i], process.env.JWT_SIGN_KEY, { ignoreExpiration: true });
            if((oldPayload.exp * 1000) > Date.now()){
                newTokens.push(oldTokens[i]);
            }
        }
       }
       newTokens.push(token);
       user.loginTokens = newTokens;
       await user.save();
       return res.status(200).json({ message: 'login successful', token: token});

    } catch (error) {
        next(error);
    }

}

//forgot password
exports.postForgotPassword = async (req, res, next) => {
    const email = req.body.email;

    try {
        //validate and sanitize input
        let errors = [];
        if(!isEmail(email.trim())) {
            errors.push({message: 'Invalid email'})
        }
        if(errors.length > 0){
            throwError({
                message: 'Invalid email',
                detail: 'Validation failed due to invalid email address',
                status: 422,
                validationErrors: errors
            })
        }
        const sanEmail = normalizeEmail(email.trim());
        
        //check if the user exists in the db
        const user = await User.findOne({email: sanEmail});
        if(!user){
            throwError({
                message: 'User not found',
                detail: 'No user associated with such email',
                status: 404
            })
        }

        //generate a password reset otp token, store in db and send to user's email
        const otpToken = otp.generateOTP(config.otp.duration);
        user.passwordResetOTP = otpToken;
        await user.save();
        res.status(200).json({
            message: 'Password reset OTP successfully sent', 
            expiresIn: `Token expires after ${config.otp.duration} minutes`
        })

        //send email
        const passwordResetEmailConfig = {
            email: user.email,
            name: user.fullName,
            duration: config.otp.duration,
            token: otpToken
        }
        const mailOpts = passwordResetEmail(passwordResetEmailConfig);
        await transporter().sendMail(mailOpts);

        
    } catch (error) {
        console.log(error);
        next(error);
    }
}

//verify password reset token
exports.postVerifyPasswordResetOTP = async (req, res, next) => {
    const otpToken = req.body.resetpasswordtoken;
   try {
        const isOTPValid = otp.verifyOTP(otpToken, config.otp.duration);
        if(!isOTPValid){
            throwError({
                message: 'Invalid or expired token',
                detail: 'The password reset OTP verification code is either expired or invalid',
                status: 401
            });
        }
        const user = await User.findOne({ passwordResetOTP: otpToken });
        if(!user){
            throwError({
                message: 'User not found',
                detail: 'Unable to find user with such token',
                status: 404
            })
        }
        return res.status(200).json({ 
            message: 'Password reset OTP successfully verified',
            email: user.email
        })

   } catch (error) {
       next(error);
   }
}

//new password

exports.postUpdatePassword = async (req, res, next) => {
    const { email, newpassword, confirmpassword } = req.body;

    try {
         //validate input
        const errors = [];
        if (!matches(newpassword, passwordRegExp())) {
            errors.push({ message: 'Password must be minimum of 8 containing at least one letter, one number and special character(s) @, $, !' });
        }
        if (newpassword !== confirmpassword) {
            errors.push({ message: 'password do not match' });
        }
        const sanPassword = newpassword.trim();
        if(errors.length > 0){
            throwError({
                message: 'Invalid inputs',
                detail: 'Failed to create new password due to wrong inputs',
                status: 422,
                validationErrors: errors
            })
        }
        
        //find user and update password
        const user = await User.findOne({ email: email });
        if(!user){
            throwError({
                message: 'User not found',
                detail: 'Could not find the user with such email to update password',
                status: 404
            });
        }
        //hash the password
        const harshedPassword = await hash(sanPassword, 12);
        user.password = harshedPassword;
        user.passwordResetOTP = undefined;
        const savedUser = await user.save();
        const returnUser = {
            ...savedUser._doc,
            password: undefined,
            status: undefined,
            loginTokens: undefined
        }
        return res.status(200).json({ message: 'Password successfully updated', user: returnUser})

    } catch (error) {
        next(error);
    }
}



