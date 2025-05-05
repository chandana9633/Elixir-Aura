const isAdminAuthenticated = (req, res, next) => {
    if (req.session.admin) {
        // console.log('======= isauthenticated ======',req.session.admin);
        return next()
    }
    res.redirect('/admin/adminLogin')
}

const ensureAuthenticated = (req, res, next) => {
    if (!req.session.admin) {
        return next()
    }
    res.redirect('/admin/dashboard')
}

const ensureAdminAuthenticated = (req, res, next) => {
    if (req.session.admin) { 
        return next();
    }
    res.redirect('/adminLoginPage'); 
};
module.exports = {
    isAdminAuthenticated,
    ensureAuthenticated,
    ensureAdminAuthenticated
}