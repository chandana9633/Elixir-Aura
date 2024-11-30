const User = require("../../models/user/userModel");

const succsessGoogleLogin = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect('/failure');
        }

        let existingUser = await User.findOne({ googleId: req.user.id });

        if (!existingUser) {
            existingUser = new User({
                googleId: req.user.id,
                name: req.user.displayName,
                email: req.user.emails[0].value,
                profilePicture: req.user.photos[0].value,
                status: 'Active',
            });

            await existingUser.save();
            console.log("New user created:", existingUser);
        } else {
            console.log("User already exists:", existingUser);
        }

        req.session.user = existingUser;
        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.redirect('/failure');
            }
            res.redirect('/'); 
        });
    } catch (error) {
        console.error("Error during Google login:", error);
        res.redirect('/failure');
    }
};


const failureGoogleLogin = (req, res) => {
    res.status(500).send('Error during login');
};

module.exports = {
    succsessGoogleLogin,
    failureGoogleLogin
};
