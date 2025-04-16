const User = require('../../models/user/userModel');
const Order = require('../../models/user/orderMoel');
const Coupon = require('../../models/admin/coponModel');
const Cart = require('../../models/user/cartModel');


const couponPage = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const user = req.session.user;

        if (!userId) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const currentDate = new Date();
        const validCoupons = await Coupon.find({ expiryDate: { $gte: currentDate } }).exec();

        res.render('user/couponPage', { user, coupon: validCoupons });
    } catch (error) {
        console.error('Error in couponPage:', error.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};


const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        // console.log(couponCode);
        
        const userId = req.session.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access.' });
        }

        const coupon = await Coupon.findOne({ coponCode: couponCode });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found.' });
        }

        if (new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ success: false, message: 'Coupon has expired.' });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }

        if (cart.couponId === coupon._id) {
            return res.status(400).json({ success: false, message: 'Coupon already applied.' });
        }

        let discountPercentage = coupon.discountPercentage;
        console.log(discountPercentage);

        // console.log(cart.totalAmount,'total  ');
        
        

        let discount = Math.floor((cart.totalAmount * discountPercentage) / 100);
        
        discount = Math.min(discount, cart.totalAmount); 

        const newTotal = Math.floor(cart.totalAmount - discount);

        cart.couponDiscount = discount;
        cart.totalAmount = newTotal;
        cart.couponId = coupon._id;

        await cart.save();

        res.json({
            success: true,
            message: 'Coupon applied successfully.',
            data: { newTotal, discount },
        });
    } catch (error) {
        console.error('Error in applying coupon:', error.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};



const removeCoupon = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }

        const originalTotal = cart.totalAmount + cart.couponDiscount;

        cart.totalAmount = originalTotal;
        cart.couponDiscount = 0;
        cart.couponId = null;

        await cart.save();

        res.json({ success: true, message: 'Coupon removed successfully.', data: { newTotal: originalTotal } });
    } catch (error) {
        console.error('Error in removing coupon:', error.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

module.exports = {
    couponPage,
    applyCoupon,
    removeCoupon
};
