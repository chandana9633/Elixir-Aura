const authenticated=(req,res,next)=>{
    if(req.session.user){
        next()
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