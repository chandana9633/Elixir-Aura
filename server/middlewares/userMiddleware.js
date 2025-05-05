const User = require("../models/user/userModel")

const authenticated=async(req,res,next)=>{
    if(req.session.user){
        try {
            const userStatus = await User.findById(req.session.user.id);
            if (userStatus && userStatus.status === 'Blocked') {
                console.log('User is blocked');
                return res.redirect('/logout');
            }
            console.log('user', req.session.user);
            return next();
        } catch (err) {
            console.error('Error fetching user:', err);
            return res.redirect('/register');
        }
    }
    res.redirect('/register')
}

const forwardAuthenticated=(req,res,next)=>{
    if(!req.session.user){
        return next()
    }
    res.redirect('/')
}


module.exports={
    authenticated,
    forwardAuthenticated,
}