const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { registrationEmail } = require('../utils/support');
const { transporter, generateCode } = require('../utils/helper');

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