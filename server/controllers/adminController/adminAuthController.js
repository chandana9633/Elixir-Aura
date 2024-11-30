const Admin = require('../../models/admin/adminModel'); 
const bcrypt = require('bcrypt'); 
const User = require('../../models/user/userModel'); 

const adminLoginPage = async (req, res) => {
    res.render('admin/adminLogin');
};

const admindashboard=async (req,res) => {
    res.render('admin/adminIndex')
}

const admin='admin@gmail.com'
const adminPassword='1234'

const adminHome = async (req, res) => {
    const { email, password } = req.body;

    console.log(email,"adminside");
    console.log(password,"adminside");
    
    const fieldErrors = {};
    if (!email || !password) {
        if (!email) fieldErrors.email = 'Please enter a valid email.';
        if (!password) fieldErrors.password = 'Please enter your password.';
        return res.status(400).json({ fieldErrors })
    }

    try {
        // const admin = await Admin.findOne({ email });
        // if (!admin) {
        //     fieldErrors.email = 'Incorrect email or password';
        //     return res.status(401).json({ fieldErrors });
        // }
        

        // const isMatch = await bcrypt.compare(password, admin.password);
        // if (!isMatch) {
        //     fieldErrors.password = 'Incorrect email or password';
        //     return res.status(401).json({ fieldErrors });
        // }

        if (email===admin&&password===adminPassword) {
            req.session.admin=true;
            res.status(200).json({ redirectUrl: '/admin/dashboard' });
        }
    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};
const getUsersList = async (req, res) => {
    try {
        const limit = 5;
        const page = parseInt(req.query.page) || 1;

        const totalUsers = await User.countDocuments();
        const totalPages = Math.ceil(totalUsers / limit);

        const users = await User.find()
            .skip((page - 1) * limit) 
            .limit(limit);

        res.render('admin/usersList', { 
            users, 
            currentPage: page, 
            totalPages 
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Server Error');
    }
};


const changeStatus = async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = status;  

        await user.save(); 

        res.status(200).json({ success: true, status: user.status });
    } catch (error) {
        console.error('Error changing user status:', error);
        res.status(500).json({ message: 'Failed to change user status' });
    }
};


const adminLogout=async (req,res) => {
    req.session.destroy()
    res.redirect('/admin/adminLoginPage')
}

module.exports = {
    adminLoginPage,
    admindashboard,
    adminHome,
    getUsersList,
    changeStatus,
    adminLogout
};
