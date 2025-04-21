// otpController.js
const nodemailer = require('nodemailer');
const Otp = require('../../models/user/otpModel');
const User = require('../../models/user/userModel');

// Generate OTP function
function generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP:', otp);
    return otp;
}

// Send OTP via email
const sendOtpMail = async (email, otp) => {
    if (!process.env.AUTH_EMAIL || !process.env.AUTH_PASS) {
        throw new Error('Email authentication environment variables not set');
    }
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.AUTH_EMAIL,
            pass: process.env.AUTH_PASS
        }
    });
    
    
    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: 'Your OTP Code',
        text: `Your verification code is ${otp}. Do not share this code with anyone.`
    };
    
    try {
        console.log(otp,'otppppppppppppppppppppp');
        await transporter.sendMail(mailOptions);
        console.log(otp,'otppppppppppppppppppppp');
        console.log('sendotp email')
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

// Initial OTP send
const sendOtp = async (email) => {
    try {
        const user = await User.findOne({ email });
        console.log('Checking email:', email);
        
        if (user) {
            console.log('User already exists');
            throw new Error('User already exists');
        }

        const otp = generateOTP();
        await Otp.deleteMany({ email });
        
        const newOtp = new Otp({
            email,
            otp,
            createdAt: new Date() 
        });

        await newOtp.save();
        console.log('otp new otp',newOtp)
        await sendOtpMail(email, otp);
       
        return { success: true, message: 'OTP has been sent to your email' };
    } catch (error) {
        console.error('Error generating or sending OTP:', error.message);
        throw error;
    }
};

// Resend OTP functionality
const resendOtp = async (req, res) => {
    try {
        const email = req.session.notAuthenticatedUser?.email || req.body.email;
        console.log('Resending OTP for email:', email);

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email not found in session' 
            });
        }

        const otp = generateOTP();
        console.log('New OTP generated:', otp);

        await Otp.deleteMany({ email });

        const newOtp = new Otp({
            email,
            otp,
            createdAt: new Date()
        });
        await newOtp.save();
        await sendOtpMail(email, otp);

        res.status(200).json({ 
            success: true, 
            message: 'OTP has been resent to your email' 
        });
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error resending OTP: ' + error.message 
        });
    }
};

// forgotpassword mail

const sendForgotPassMail = async (email, link) => {
    if (!process.env.AUTH_EMAIL || !process.env.AUTH_PASS) {
        throw new Error('Email authentication environment variables not set');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.AUTH_EMAIL,
            pass: process.env.AUTH_PASS
        }
    });

    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: 'Your Elixir Aura reset Password Link',
        text: `Your Reset Password link is ${link}. Do not share this code with anyone.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = {
    sendOtp,
    resendOtp,
    sendForgotPassMail
};