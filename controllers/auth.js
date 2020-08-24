const { isEmail, isEmpty, matches, isAlpha, normalizeEmail } = require('validator');
const { hash, compare } = require('bcryptjs');
const { throwError, passwordRegExp, transporter, sanitizeName } = require('../utils/helper');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const emailVerifyLink = 'http://localhost:8080/login';

exports.signup = async(req, res, next) => {

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

        //send a confirmation mail to the user
        const newUser = {
            email: sanEmail,
            firstname: sanFirstname,
            middlename: sanMiddlename,
            lastname: sanLastname,
            password: hashedPassword,
            institution: institution,
            educationlevel: educationlevel,
        }
        const token = jwt.sign(newUser, process.env.JWT_SIGN_KEY);
        res.status(200).json({ message: 'Email verification sent to your email address' })
        const mailOPts = {
            from: 'calculusky@gmail.com',
            to: sanEmail,
            subject: 'Edubox email verification',
            html: `<div style="border-radius:5px">
                                    <h2>EDUBOX</h2>
                                    <p>Hi, ${savedUser.firstname}</p> 
                                    <p>You have one more step remaining to activate your EDUBOX account. Kindly click on the button below to verify your email address</p>
                                    <span><a style="text-decoration:none; color:white; background-color:blue; padding:5px 8px; border-radius:4px" href="${emailVerifyLink}/${token}">Verify my email</a></span>
                                    <p style="color:grey">Didn't work? Copy the link below and paste into your web browser</p>
                                    <p><a style="text-decoration:none; color:blue" href="${emailVerifyLink}/${token}">${emailVerifyLink}/${token}"</a></p>
                                    <p> Warm regards </p>
                                    <span>Edubox</span>
                        </div>`
        }
        await transporter().sendMail(mailOPts);

    } catch (error) {
        console.log(error, 'catch err')
        next(error)
    }
}