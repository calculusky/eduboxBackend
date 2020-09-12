const { isEmail, isEmpty, matches, isAlpha, normalizeEmail } = require('validator');
const { hash, compare } = require('bcryptjs');
const { throwError, passwordRegExp, transporter, sanitizeName, generateCode, verifyEmailCodeRegExp } = require('../utils/helper');
const { registrationEmail, successfulRegistrationEmail } = require('../utils/support');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.postSignup = async(req, res, next) => {
    const {
        firstname,
        middlename,
        lastname,
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
    if (!isAlpha(firstname)) {
        errors.push({ message: 'Please enter a valid first name' })
    }
    if (!isAlpha(middlename)) {
        errors.push({ message: 'Please enter a valid middlename' })
    }
    if (!isAlpha(lastname)) {
        errors.push({ message: 'Please enter a valid last name' })
    }
    if (!isAlpha(institution)) {
        errors.push({ message: 'Please enter a valid institution name' })
    }
    if (!isAlpha(educationlevel)) {
        errors.push({ message: 'Please enter a valid education level' })
    }
    if (!matches(password, passwordRegExp())) {
        errors.push({ message: 'Invalid password' });
    }
    if (password !== confirmpassword) {
        errors.push({ message: 'password do not match' })
    }

    //sanitize the input
    const sanEmail = normalizeEmail(email.trim());
    const sanPassword = password.trim();
    const sanFirstname = sanitizeName(firstname.trim());
    const sanMiddlename = sanitizeName(middlename.trim());
    const sanLastname = sanitizeName(lastname.trim());
    try {
        //call the error handling function and forward the validation errors to the error handling middleware
        if (errors.length > 0) {
            throwError('invalid signup input', 422, errors);
        }

        //check if the user exists 
        const existingUser = await User.findOne({ email: sanEmail });
        if (existingUser) {
            const error = new Error('Email already exists');
            error.statusCode = 422;
            throw error;
        }

        //store the user in the db and return a token to the client  in case the user received no mail
        const emailVerificationCode = generateCode();
        const harshedPassword = await hash(sanPassword, 12);
        const newUser = {
            email: sanEmail,
            firstname: sanFirstname,
            middlename: sanMiddlename,
            lastname: sanLastname,
            password: harshedPassword,
            institution: institution,
            educationlevel: educationlevel,
            emailVerificationCode: emailVerificationCode
        }
        const token = await jwt.sign(newUser, process.env.JWT_SIGN_KEY);
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
            name: sanFirstname,
            code: emailVerificationCode
        }
        const mailOPts = registrationEmail(registrationEmailVariables);
        await transporter().sendMail(mailOPts);

    } catch (error) {
        console.log(error, 'catch err')
        next(error)
    }
}


exports.postResendEmailVerificationCode = async(req, res, next) => {
    //post request
    const token = req.body.token;
    try {
        const decodedUser = await jwt.verify(token, process.env.JWT_SIGN_KEY);
        if (!decodedUser) {
            const error = new Error('Invalid token');
            error.statusCode = 401;
            throw error
        }

        //generate another code and store in db
        const emailVerificationCode = generateCode();
        const user = await User.findOne({ email: decodedUser.email });
        console.log(user, 'user')
        if (!user) {
            const error = new Error('Error fetching user');
            error.statusCode = 500;
            throw error;
        }
        user.emailVerificationCode = emailVerificationCode;
        await user.save();

        //resend the email
        const registrationEmailVariables = {
            email: decodedUser.email,
            name: decodedUser.firstname,
            code: emailVerificationCode,
        }
        const mailOPts = registrationEmail(registrationEmailVariables);
        res.status(200).json({ message: 'Email verification successfuly resent', token: token })
        await transporter().sendMail(mailOPts);


    } catch (error) {
        next(error);
    }

}

exports.postVerifyEmail = async(req, res, next) => {

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
            throwError('invalid verification input', 401, errors)
        }

        const newUser = await User.findOne({ emailVerificationCode: sanCode, email: sanEmail });
        if (!newUser) {
            const error = new Error('Invalid code');
            error.statusCode = 401;
            throw error;
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
            name: newUser.firstname
        }
        const mailOPts = successfulRegistrationEmail(successfulRegistrationEmailVariables);
        await transporter().sendMail(mailOPts);

    } catch (error) {
        next(error)
    }
}