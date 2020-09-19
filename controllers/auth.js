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
            throwError({ 
                message: 'invalid token', 
                status: 401, 
                validationErrors: null
            });
        }

        //generate another code and store in db
        const emailVerificationCode = generateCode();
        const user = await User.findOne({ email: decodedUser.email });
        if (!user) {
            throwError({ 
                message: 'User not found', 
                status: 404, 
                validationErrors: null
            });
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
            throwError({ 
                message: 'invalid verification input', 
                status: 422, 
                validationErrors: errors
            });
        }

        const newUser = await User.findOne({ emailVerificationCode: sanCode, email: sanEmail });
        if (!newUser) {
            throwError({ 
                message: 'incorrect code or email', 
                status: 401, 
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
            name: newUser.firstname
        }
        const mailOPts = successfulRegistrationEmail(successfulRegistrationEmailVariables);
        await transporter().sendMail(mailOPts);

    } catch (error) {
        next(error)
    }
}

exports.postLogin = async (req, res, next) => {
    const { email, password } = req.body;

    //validate
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
                status: 404, 
                validationErrors: null
            });
        }
        const isMatch = await compare(sanPassword, user.password);
        if(!isMatch){
            throwError({ 
                message: 'incorrect password', 
                status: 422, 
                validationErrors: null
            });
        }
        
        const userPayload = {
            _id: user._doc._id,
            firstname: user._doc.firstname,
            lastname: user._doc.lastname,
            email: user._doc.email,
            institution: user._doc.institution
        }
        const token = jwt.sign(userPayload, process.env.JWT_SIGN_KEY, { expiresIn: '12h' });
        user.loginToken = token;
        await user.save();
        return res.status(200).json({ message: 'login successful', token: token});

    } catch (error) {
        next(error);
    }

}






