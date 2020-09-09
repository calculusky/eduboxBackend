const nodemailer = require('nodemailer');
const mailgun = require('nodemailer-mailgun-transport');


exports.throwError = (message, statusCode, errors) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.data = errors;
    throw error;
}

//check for password ****Note*** At least one lowercase, uppercase, numeral and special characters: @,!,$ only with minimum of 8 characters
exports.passwordRegExp = () => {
    const regExp = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[@!$])(?!.*[£&#_%^*+()\-\~\`\\/\"\'|\[\]}{:;/>.<,])(?!.*\s).{8,}$/;
    return regExp;
}

//create an email transport
exports.transporter = () => {
    const api = {
        auth: {
            api_key: process.env.SMTP_API_KEY,
            domain: process.env.SMTP_DOMAIN
        }
    }
    const transporter = nodemailer.createTransport(mailgun(api));
    return transporter;
}

//sanitize name
exports.sanitizeName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

//generate email verification code
exports.generateCode = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJK01234LMNOPQRSTUVWXYZ56789';
    for(let i = 0; i < length; i++){
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
