const User = require('../../models/user/userModel');

const   userProfile = async (req, res) => {
    try {
       const userId=req.session.user?.id
       
       const user=await User.findById(userId)
        console.log(user,'-----------------------------');
        
        res.render('user/userProfile',{user});
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).send("Internal Server Error.");
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.session.user?.id;

        if (!userId) {
            return res.status(401).send('Unauthorized. User not logged in.');
        }

        const { name } = req.body; 

        if (!name) {
            return res.status(400).send('Name is required.');
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name },
            { new: true, runValidators: true }
        );

        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Internal Server Error.');
    }
};


module.exports = {
    userProfile,
    updateProfile,
};
