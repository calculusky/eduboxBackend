const nodemailer = require('nodemailer');
const mailgun = require('nodemailer-mailgun-transport');


exports.throwError = ({message, status, detail, validationErrors}) => {
    const error = new Error(message);
    error.status = status;
    error.detail = detail;
    error.data = validationErrors;
    throw error;
}

//check for password ****Note*** At least one letter, numeral and special characters: @,!,$ only with minimum of 8 characters
exports.passwordRegExp = () => {
    const regExp = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[@!$])(?!.*[£&#_%^*+()\-\~\`\\/\"\'|\[\]}{:;/>.<,])(?!.*\s).{8,}$/;
    return regExp;
}

exports.verifyEmailCodeRegExp = () => {
    const regExp = /^(?=.*[a-zA-Z0-9])(?!.*[@!$£&#_%^*+()\-\~\`\\/\"\'|\[\]}{:;/>.<,])(?!.*\s).{6}$/;
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
exports.generateCode = () => {
    let length = 6;
    let result = '';
    const characters = 'ABCDEFGHIJK01234LMNOPQRSTUVWXYZ56789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}