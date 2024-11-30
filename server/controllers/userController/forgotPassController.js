const User = require('../../models/user/userModel');
const nodemailer = require('nodemailer');


const fotgotPassPage = async (req, res) => {
    try {
        res.render('user/forgotPassword'); 
        console.log(',jeh---------------------');
        
    } catch (error) {
        console.error('Error rendering OTP page:', error);
        res.status(500).json({ error: 'Error rendering OTP page.' });
    }
};

const forgotPasswordSubmit=async (req,res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email })
    } catch (error) {
        
    }
}


module.exports = {
    fotgotPassPage,
    forgotPasswordSubmit
   
};
