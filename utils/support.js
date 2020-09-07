exports.registrationEmail = ({ email, name, code, link }) => {
    const mailOPts = {
        from: 'calculusky@gmail.com',
        to: email,
        subject: 'Edubox email verification',
        html: `<div style="border-radius:5px">
                                <h2>EDUBOX</h2>
                                <p>Hi, ${name}</p> 
                                <p>You have one more step remaining to activate your EDUBOX account. Kindly click on the button below to verify your email address</p>
                                <p>Edubox verification code: <h3>${code}</h3> <p>
                                <span><a style="text-decoration:none; color:white; background-color:blue; padding:5px 8px; border-radius:4px" href="${link}/?verifycode=${code}&email=${email}">Verify my email</a></span>
                                <p><a style="text-decoration:none" href="${link}/?verifycode=${code}&email=${email}">${link}/?verifycode=${code}&email=${email}</a></p>
                                <p> Warm Regards! </p>
                                <h4>Edubox</h4>
                    </div>`
    }
    return mailOPts;
}