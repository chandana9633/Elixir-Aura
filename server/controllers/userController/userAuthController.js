const User = require("../../models/user/userModel");
const bcrypt = require('bcrypt');
const Otp = require('../../models/user/otpModel');
const Product = require('../../models/admin/productModel')
const { sendOtp } = require('./otpController');

const renderHome = async (req, res) => {
    try {
        const products = await Product.find({ status: 'Active' });
        
        const latestProduct = [];
        const allProduct = [];

        for (let i = products.length - 1; i >= 0; i--) {
            if (latestProduct.length < 4) {
                latestProduct.push(products[i]);
            } else  if (allProduct.length < 4) {
                allProduct.unshift(products[i]);
            }
        }

        console.log("Latest Products:", latestProduct);
        console.log("All Products:", allProduct);

        res.render("user/index", { user: req.session.user, latestProduct, allProduct });
    } catch (error) {
        console.error("Error rendering home page:", error);
        res.status(500).send("Server error");
    }
};


const userRegister = async (req, res) => {
    res.render("user/userRegister");
}


const userLogin = async (req, res) => {
    try {
        res.render("user/userLogin"); 
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}


const otpRender = async (req, res) => {
    res.render("user/otp", {
        message: "OTP sent to your email",
    });
}

const signUpUser = async (req, res) => {
    
    const { name, email, password, conformPassword } = req.body;
    console.log(name, password, email);

    if (!name || !email || !password || !conformPassword) {
        // return res.status(400).json({ message: "Please fill in all fields." });
    }

    if (password !== conformPassword) {
        return res.status(400).json({ message: "Passwords do not match!" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists." });
        }

        // const newUser = new User({ name, email, password });
        const hashPassword=await bcrypt.hash(password,12)
        console.log(hashPassword)
        req.session.notAuthenticatedUser = {
            name,
            email,
            password,
            hashPassword
        }
        

        await sendOtp(email);

        res.status(200).json({ message: "User registered successfully!" });
    } catch (error) {
        console.log("Error in signUpUser:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
};

//---------verifying otp ------------------
const verifyOTP = async (req, res) => {
    const { otp } = req.body;
    console.log('Session data:', req.session);

    const email = req.session.notAuthenticatedUser?.email;
    console.log('email:', email);
    console.log('Received OTP:', otp);

    try {
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Session expired. Please try again.' 
            });
        }
        
        const otpEntry = await Otp.findOne({ email });
        if (!otpEntry) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP expired or not found.' 
            });
        }

        // Verify OTP
        if (otpEntry.otp === otp) {

            console.log('OTP matched!');

            const newUser = new User({
                name: req.session.notAuthenticatedUser.name,
                email: req.session.notAuthenticatedUser.email,
                password: req.session.notAuthenticatedUser.password
            });

            await newUser.save();
            req.session.user ={
                name: req.session.notAuthenticatedUser.name,
                email: req.session.notAuthenticatedUser.email,
                password: req.session.notAuthenticatedUser.password
            }
            delete req.session.notAuthenticatedUser
            console.log('New user created:', newUser);

            await Otp.deleteMany({ email }); 
            
            return res.json({ 
                success: true, 
                message: 'OTP verified and user registered successfully!',
                shouldRedirect: true,
                redirectUrl: '/' 
            });
            // req.session.notAuthenticatedUser = null;
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP' 
            });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

//--------signIn-----------------
const signIn = async (req, res) => {
    
    const { email, password } = req.body;

    console.log('===========',password);
    // console.log("lllllllllllll", email)
    
    if (!email || !password) {
        return res.status(400).json({ errorMessage: "please fill all fields", fieldErrors: { email: !email, password: !password } })
    }

    try {
        const user = await User.findOne({status:'Active', email });
        if (!user) {
            return res.status(401).json({ message: 'Your account is blocked.' });
        }
        const isMatch = user.password===password
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        req.session.user = {
            id:user._id,
            name: user.name,
            email: user.email
        }
        // console.log( req.session.user );
        
        res.status(200).json({ message: 'Sign in successful' });
    } catch (error) {
        console.error('Error during sign-in:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

const logout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Session destruction error:", err);
            return res.status(500).send("Logout failed.");
        }
        res.redirect('/'); 
    });
};

module.exports = {
    renderHome,
    userRegister,
    userLogin,
    signUpUser,
    otpRender,
    verifyOTP,
    signIn,
    logout,
};
