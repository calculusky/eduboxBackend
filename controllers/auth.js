const { isEmail, isEmpty, matches, isAlpha, normalizeEmail } = require('validator');
const { hash, compare } = require('bcryptjs');
const { throwError, passwordRegExp, transporter, sanitizeName } = require('../utils/helper');
const User = require('../models/user');

exports.signup = async (req, res, next) => {
    
    const { firstname, 
            middlename, 
            lastname, 
            email, 
            password, 
            confirmpassword, 
            institution, 
            educationlevel } = req.body;
    

    //validate user input
    const errors = []
    if(!isEmail(email)){
        errors.push({message: 'Invalid email address'});
    }
    if(!isAlpha(firstname)){
        errors.push({message: 'Please enter a valid first name'})
    }
    if(!isAlpha(middlename)){
        errors.push({message: 'Please enter a valid middlename'})
    }
    if(!isAlpha(lastname)){
        errors.push({message: 'Please enter a valid last name'})
    }
    if(!isAlpha(institution)){
        errors.push({message: 'Please enter a valid institution name'})
    }
    if(!isAlpha(educationlevel)){
        errors.push({message: 'Please enter a valid education level'})
    }
    if(!matches(password, passwordRegExp())){ 
        errors.push({message: 'Invalid password'});
    }
    if(password !== confirmpassword){
        errors.push({message: 'password do not match'})
    }

    //sanitize the input
    const sanEmail = normalizeEmail(email.trim());
    const sanPassword = password.trim();
    const sanFirstname = sanitizeName(firstname.trim());
    const sanMiddlename = sanitizeName(middlename.trim());
    const sanLastname = sanitizeName(lastname.trim());
    try {  
        //call the error handling function and forward the validation errors to the error handling middleware
        if(errors.length > 0){
            throwError('invalid signup input', 422, errors);
        }
                    
        //check if the user exists 
        const existingUser = await User.findOne({email: sanEmail});
        if(existingUser){
            const error = new Error('Email already exists');
            error.statusCode = 422;
            throw error;
        }

        //hash the password and store in db
        const hashedPassword = await hash(sanPassword, 12);
        const user = new User({
            email: sanEmail,
            firstname: sanFirstname,
            middlename: sanMiddlename,
            lastname: sanLastname,
            password: hashedPassword,
            institution: institution,
            educationlevel: educationlevel,
        })
        const savedUser = await user.save();
        const returnUser = {
            ...savedUser._doc,
            password: undefined
        }
        
        //send registration mail
        const mailOPts = {
            from: 'calculusky@gmail.com',
            to: sanEmail,
            subject: 'Welcome to Edubox',
            text: 'This is for testing',
            html: `<div style="border-radius:5px">
                                    <h2>Signup successful </h2>
                                    <p>Hi, ${savedUser.firstname}</p>
                                    <p> Thank you for signing up to Edubox. Your account has been successfully created.</p>
                                    <p> Warm regards. </p>
                        </div>`
        }
        const sendMessage = await transporter().sendMail(mailOPts); 
        if(sendMessage){
            console.log(sendMessage, 'sendm');
            return res.status(200).json({message: 'Account successfully created', user: returnUser})        
        }
        
    } catch (error) {
        console.log(error, 'catch err')
    next(error)
  }
}

