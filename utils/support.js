exports.registrationEmail = ({ email, name, code }) => {
    const mailOPts = {
        from: 'calculusky@gmail.com',
        to: email,
        subject: 'Edubox email verification',
        html: `<div style="border-radius:5px">
                                <h2>EDUBOX</h2>
                                <p>Hi, ${name}</p> 
                                <p>You have one more step remaining to activate your EDUBOX account. Here is the 6-digits code to verify your email address</p>
                                <p>Edubox verification code: <h3>${code}</h3> </p>
                                <p>If you did not receive the email, kindly ignore it</p>
                                <p> Warm Regards! </p>
                                <h4>Edubox</h4>
                    </div>`
    }
    return mailOPts;
}