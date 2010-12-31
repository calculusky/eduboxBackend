const User = require('../models/user');
const { throwError } = require('../utils/helper');

exports.dashboard = async (req, res, next) => {
    
    try {
        const user = await User.findById(req.userId);
        if(!user){
            throwError({ 
                message: 'User not found', 
                status: 404, 
                detail: 'The user could not be found in the database'
            });
        }
        const returnUser = {
            ...user._doc,
            password: undefined,
            status: undefined,
            loginToken: undefined
        }
        return res.status(200).json({message: 'dashboard', user: returnUser });
    } catch (error) {
        next(error)
    }
}