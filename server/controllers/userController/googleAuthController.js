const User = require("../../models/user/userModel");
const Wallet=require('../../models/user/walletModel')


const succsessGoogleLogin = async (req, res) => {
    try {
        // if (!req.user) {
        //     return res.redirect('/failure');
        // }

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
            console.log("New user created:", existingUser._id);
            req.session.user = {
                id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email
            };
            console.log('session after google login',req.session.user)


        } else {
            req.session.user = {
                id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email
            };
            
            // req.session.user.save()
            console.log('session after google login',req.session.user?.id)
            console.log("User already exists:", existingUser);
        }
        

         const wallet = await Wallet.findOne({ userId:existingUser._id });
                if (!wallet) {
                    console.log('wallet page ')
                    let walletDetails ={ 
                        userId:existingUser._id, 
                        total: 0, 
                        returnAmount: 0, 
                        canceledAmount: 0, 
                        walletEntries: [] 
                    }
                   let newWallet = await Wallet.create(walletDetails)
                    console.log('new wallet create',newWallet)
                   
                }
        
        // req.session.user = existingUser;
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
