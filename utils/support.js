exports.registrationEmail = ({ email, name, code }) => {
    const mailOPts = {
        from: process.env.EMAIL_SENDER,
        to: email,
        subject: 'Edubox email verification',
        html: `<div style="border-radius:5px">
                                <h2>EDUBOX</h2>
                                <p>Hi, ${name}</p> 
                                <p>You have one more step remaining to activate your EDUBOX account. Here is the 6-digits code to verify your email address</p>
                                <p>Edubox verification code:</p>
                                <h3>${code}</h3> 
                                <p>If you did not receive the email, kindly ignore it</p>
                                <p> Warm Regards! </p>
                                <h4>Edubox</h4>
                    </div>`
    }
    return mailOPts;
}

exports.successfulRegistrationEmail = ({ email, name }) => {
    const mailOPts = {
        from: process.env.EMAIL_SENDER,
        to: email,
        subject: 'Edubox email verification',
        html: `<div style="border-radius:5px">
                                <h2>Welcome to EDUBOX</h2>
                                <p>Dear, ${name}</p> 
                                <p>Your email has been verified. </p> 
                                <p>We are excited that you made a great choice by choosing Edubox platform </p>
                                <p>If you did not receive the email, kindly ignore it</p>
                                <p> Warm Regards! </p>
                                <h4>Edubox</h4>
                    </div>`
    }
    return mailOPts;
}

//password reset email
exports.passwordResetEmail = ({ email, name, duration, token }) => {
    const mailOPts = {
        from: process.env.EMAIL_SENDER,
        to: email,
        subject: 'Edubox Password Reset ',
        html: `<div style="border-radius:5px; box-shadow: 1px 1px 3px #222">
                                <h2>EDUBOX Password Reset</h2>
                                <p>Dear ${name},</p> 
                                <p>Here is your password reset OTP</p>
                                <h3>${token}</h3> 
                                <p>Please note that the OTP expires after ${duration} minutes. Make sure you verify within the time frame</p>
                                <p>If you did not receive the email, kindly ignore it</p>
                                <p> Warm Regards! </p>
                                <h4>Edubox</h4>
                    </div>`
    }
    return mailOPts;
}