const bcrypt = require('bcrypt');
const User = require('../../models/user/userModel');
const nodemailer = require('nodemailer');
const { sendForgotPassMail } = require('./otpController');
    

const fotgotPassPage = async (req, res) => {
    try {
        res.render('user/forgotPassword'); 
        
    } catch (error) {
        console.error('Error rendering OTP page:', error);
        res.status(500).json({ error: 'Error rendering OTP page.' });
    }
};

const fotgotPassemail = async(req,res) => {
    try{
        const email = req.body.email;
        let link = `http://localhost:5000/resetPassword/${email}`
        await sendForgotPassMail(email,link);
        res.send("Reset password link has been sent to your email");
    }catch(error){
        console.log(error)
    }

}

const resetPasswordPage = async(req,res)=>{
    const email = req.params.email
    res.render('user/resetPassword',{email:email})
}

const postResetPasswordPage = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (!email || !password || !confirmPassword) {
            return res.status(400).send('All fields are required.');
        }

        if (password !== confirmPassword) {
            return res.status(400).send('Passwords do not match.');
        }

        if (password.length < 8) {
            return res.status(400).send('Password must be at least 8 characters long.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.findOneAndUpdate(
            { email },
            { $set: { password: hashedPassword } },
            { new: true }
        );

        if (!user) {
            return res.status(404).send('User not found.');
        }

        // res.send('Password reset successfully.');
        res.redirect('/userLogin')
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error.');
    }
};
const forgotPasswordSubmit = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).send('Email is required.');
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send('No account with that email found.');
        }

        res.send('Password reset link sent to your email.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error.');
    }
};

module.exports = {
    fotgotPassPage,
    forgotPasswordSubmit,
   fotgotPassemail,
   resetPasswordPage,
   postResetPasswordPage
};
