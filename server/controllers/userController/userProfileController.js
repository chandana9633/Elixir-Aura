const User = require('../../models/user/userModel');

const userProfile = async (req, res) => {
    try {
       const userId=req.session.user.id
    //    console.log(userId,'thisssssssssssssssssssssssssss');
       
       const user=await User.findById(userId)
        // console.log(user,'userrrrrrrrrrrrrrrrrrrrrrrrrrrrr');
        
        res.render('user/userProfile',{user});
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).send("Internal Server Error.");
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        console.log('Updating profile for User ID:', userId);

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
        console.log('Updated user:', updatedUser);

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
