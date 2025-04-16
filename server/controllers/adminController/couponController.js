const Coupon=require('../../models/admin/coponModel')

const couponListPage = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.render('admin/couponListPage', { coupons });
    } catch (error) {
        console.error('Error rendering Coupon List page:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const renderAddCouponPage = (req, res) => {
    try {
        res.render('admin/addCoupon'); 
    } catch (error) {
        console.error('Error rendering Add Coupon page:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const addCoupon = async (req, res) => {
    try {
        const { name, code, discount, startDate, expiryDate, maxAmount } = req.body;

        if (!name || !code || !discount || !startDate || !expiryDate || !maxAmount) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        if (discount < 0 || discount > 90) {
            return res.status(400).json({ success: false, message: 'Discount must be between 0 and 90.' });
        }

        const start = new Date(startDate);
        const expiry = new Date(expiryDate);

        if (expiry <= start) {
            return res.status(400).json({ success: false, message: 'Expiry date must be later than start date.' });
        }

        if (maxAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Max amount must be greater than zero.' });
        }

        const newCoupon = new Coupon({
            coponName: name, 
            coponCode: code, 
            discountPercentage: discount,
            startDate: startDate,
            expiryDate: expiryDate,
            maxAmount: maxAmount
        });        
        await newCoupon.save();

        res.status(201).json({ success: true, message: 'Coupon added successfully.' });
    } catch (error) {
        console.error('Error adding coupon:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
const editCouponPage = async (req, res) => {
    try {
        const couponId = req.params.id;
        const coupon = await Coupon.findById(couponId);
       
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.render('admin/editCoupon', { coupon });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const editCoupon = async (req, res) => {
    try {
        console.log("entttrrrrrrrrrrrrrrr");
        
        const couponId = req.params.id;
        const { name, code, discount, startDate, expiryDate, maxAmount } = req.body;
        console.log("couponId",couponId)
        console.log("req.body",req.body);

        if (!name || !code || !discount || !startDate || !expiryDate || !maxAmount) {
            return res.status(400).json({ message: 'Please fill all the fields!' });
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, {
            name,
            code,
            discount,
            startDate,
            expiryDate,
            maxAmount
        }, { new: true });
          console.log("updatedCoupon",updatedCoupon);

        if (!updatedCoupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.json({ success: true, message: 'Coupon updated successfully', coupon: updatedCoupon });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;

        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found.' });
        }

        await Coupon.findByIdAndDelete(couponId);

        res.json({ success: true, message: 'Coupon deleted successfully.' });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


module.exports = {
    couponListPage,
    renderAddCouponPage,
    addCoupon,
    editCouponPage,
    editCoupon,
    deleteCoupon
};
