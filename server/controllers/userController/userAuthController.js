const User = require("../../models/user/userModel");
const bcrypt = require('bcrypt');
const Otp = require('../../models/user/otpModel');
const Product = require('../../models/admin/productModel')
const Wallet=require('../../models/user/walletModel')
const Wishlist=require('../../models/user/wishlistModel')
const Cart=require('../../models/user/cartModel')
const { sendOtp } = require('./otpController');

const renderHome = async (req, res) => {
    try {
        const userId=req.session.user?.id
        const user=req.session.user
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

        let wishlistProducts = [];
        if (userId) {
            const wishlist = await Wishlist.findOne({ userId }).populate('products');
            if (wishlist) {
                wishlistProducts = wishlist.products.map(product => product._id.toString());
            }
        }
        res.render("user/index", { user: req.session.user, latestProduct,wishlistProducts, allProduct });
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


async function giveReward(userId) {
    try {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error('Invalid userId:', userId);
            return;
        }

        const rewardUser = await User.findById(userId);
        if (!rewardUser) {
            console.error('User not found for userId:', userId);
            return;
        }

        const wallet = await Wallet.findOne({ userId: userId });

        if (wallet) {
            await Wallet.findByIdAndUpdate(wallet._id, {
                $inc: { balance: 100 }, 
                $push: {
                    transaction: {
                        amount: 100,
                        type: 'Credit',
                        description: 'Referral reward for new sign-up',
                        orderId: null,
                        date: new Date()
                    }
                }
            });
        } else {
            await Wallet.create({
                userId: userId,
                balance: 100, 
                transaction: [{
                    amount: 100,
                    type: 'Credit',
                    description: 'Referral reward for new sign-up',
                    orderId: null, 
                    date: new Date()
                }]
            });
        }

        console.log(`Reward of 100 credited to userId: ${userId}`);
    } catch (error) {
        console.error('Error in giveReward function:', error);
    }
}

const signUpUser = async (req, res) => {
    const { name, email, password, conformPassword } = req.body;
    console.log(req.body,'register');
    
    if (!name || !email || !password || !conformPassword) {
        return res.status(400).json({ message: "Please fill in all fields." });
    }

    if (password !== conformPassword) {
        return res.status(400).json({ message: "Passwords do not match!" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists." });
        }

        const hashPassword = await bcrypt.hash(password, 12);

        req.session.notAuthenticatedUser = {
            name,
            email,
            password: hashPassword,
        };

        const referralUserId = req.session.refferalUser;
        if (referralUserId) {
            await giveReward(referralUserId);
        }

        await sendOtp(email);

        res.status(200).json({ message: "User registered successfully! OTP sent to your email." });
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

            console.log("new user", newUser);
            

            await newUser.save();
            req.session.user = {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            };
            delete req.session.notAuthenticatedUser

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

    console.log("88888signIn8888", email, password);

    if (!email || !password) {
        return res.status(400).json({
            errorMessage: "Please fill all fields",
            fieldErrors: { email: !email, password: !password }
        });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.status !== 'Active') {
            return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        console.log("999passwords999", user.password, password);
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email
        };

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
