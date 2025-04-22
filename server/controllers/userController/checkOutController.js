const Product=require('../../models/admin/productModel')
const User=require('../../models/user/userModel')
const Cart=require('../../models/user/cartModel')
const Order = require('../../models/user/orderMoel')
const Wallet=require('../../models/user/walletModel')
const Coupon=require('../../models/admin/coponModel')
const CategoryOffer=require('../../models/admin/categoryOfferModel')


const checkOutPage = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        console.log(userId,'hy userrrrrrrrrrrrrr');
        
        if (!userId) {
            return res.status(400).json({ error: 'User not authenticated' });
        }
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        
        const address = user.address || {};
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(404).json({ error: 'Cart is empty' });
        }

        const wallet = await Wallet.findOne({ userId });
        console.log(wallet,'waaaaaaaaaalet');
        
        if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

        const currentDate = new Date();

        // Category Offers
        const categoryOffers = await CategoryOffer.find({
            endDate: { $gte: currentDate }
        }).populate('categoryId');

        let categoryDiscountAmount = 0;

        for (const item of cart.items) {
            const matchedOffer = categoryOffers.find(offer =>
                item.productId.category &&
                offer.categoryId._id.toString() === item.productId.category._id.toString()
            );

            if (matchedOffer) {
                const discountPerUnit = Math.floor(item.productId.price * (matchedOffer.discountPercentage / 100));
                categoryDiscountAmount += discountPerUnit * item.quantity;
            }
        }

        // Coupon Handling
        let couponDiscount = 0;
        let isCouponApplied = false;

        if (cart.couponId) {
            const coupon = await Coupon.findById(cart.couponId);

            if (coupon && cart.totalAmount >= coupon.minAmount && cart.totalAmount <= coupon.maxAmount) {
                couponDiscount = Math.floor((coupon.discountPercentage / 100) * cart.totalAmount);
                isCouponApplied = true;
            } else {
                cart.couponId = null;
                cart.couponDiscount = 0;
                await cart.save();
            }
        }

        const finalAmount = Math.max(Math.floor(cart.totalAmount - categoryDiscountAmount - couponDiscount), 0);

        res.render('user/checkOutPage', {
            user,
            cart,
            cartItems: cart.items,
            address,
            wallet,
            categoryOffer: categoryOffers,
            discountAmount: categoryDiscountAmount,
            couponDiscount: isCouponApplied ? couponDiscount : 0,
            finalAmount
        });
    } catch (error) {
        console.error('Error on checkout page:', error);
        res.status(500).json({ error: 'Server error' });
    }
};




const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const { paymentMethod, selectedAddressId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User not logged in" });
        }

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        let totalQuantity = 0;
        const productItems = cart.items.map(item => {
            if (!item.productId) {
                throw new Error('Product not found');
            }
            totalQuantity += item.quantity;
            return {
                productId: item.productId._id,
                productName: item.productId.name,
                quantity: item.quantity,
                total: item.total,
                offerPrice: item.productId.price,
                status: 'Pending',
                paymentStatus: 'Paid',
            };
        });

        const user = await User.findById(userId);
        const billingAddress = user.address.find(addr => addr._id.toString() === selectedAddressId);
        if (!billingAddress) {
            return res.status(400).json({ message: "Invalid address selected" });
        }

        for (const item of cart.items) {
            const product = item.productId;
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${product.name}. Only ${product.stock} items available.`,
                });
            }
        }

        const finalAmount = cart.totalAmount || cart.grandTotal;
        if (paymentMethod === 'COD' && finalAmount > 1000) {
            return res.status(400).json({
                message: "Cash on Delivery is not available for orders above ₹1000. Please choose a different payment method.",
            });
        }

        if (paymentMethod === 'Wallet') {
            const wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                return res.status(404).json({ success: false, message: 'Wallet not found' });
            }

            let totalWalletAmount = wallet.transaction.reduce((acc, entry) => {
                return entry.type === 'Credit' ? acc + entry.amount : acc - entry.amount;
            }, 0);

            if (finalAmount > totalWalletAmount) {
                return res.status(400).json({ success: false, message: 'Insufficient balance in wallet' });
            }

            wallet.balance -= finalAmount;
            wallet.transaction.push({
                amount: finalAmount,
                type: 'Debit',
                description: 'Order Payment using wallet',
            });

            await wallet.save();
        }

        const paymentStatus = paymentMethod === 'COD' ? 'Pending' : 'Paid';

        const newOrder = new Order({
            userId,
            userName: user.name,
            productItems,
            billingAddress,
            totalQuantity,
            originalPrice: cart.grandTotal,
            totalPrice: cart.totalAmount || cart.grandTotal,
            discount: cart.couponDiscount || 0,
            paymentMethod,
            paymentStatus,
            status: 'Pending',
        });

        await newOrder.save();

        for (const item of cart.items) {
            const product = item.productId;
            product.stock -= item.quantity;
            await product.save();
        }

        // Clear the cart and reset coupon-related fields
        await Cart.findOneAndUpdate(
            { userId },
            { $set: { items: [], grandTotal: 0, discount: 0, couponId: null, couponDiscount: 0,totalAmount:0 } }
        );

        res.json({ orderId: newOrder._id });

    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ message: "Failed to place order", error: error.message });
    }
};



const successOrderPage = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        res.render('user/successOrder', { orderId });
    } catch (error) {
        console.error("Error rendering success page:", error);
        res.status(500).send("Error occurred");
    }
};



const addNewAddres = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const { street, city, state, pincode, country, phone } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found.');
        }

        if (user.address.length >= 3) {
            return res.status(400).send('You can only save up to 3 addresses.');
        }

        user.address.push({ street, city, state, pincode, country, phone });
        await user.save();

        res.status(200).send({ message: 'Address added successfully.' });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).send('Internal Server Error.');
    }
};


const updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const { street, city, state, pincode, country } = req.body;

        const user = await User.findOne({ 'address._id': addressId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressIndex = user.address.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }

        const updatedAddress = { ...user.address[addressIndex] };
        if (street) updatedAddress.street = street;
        if (city) updatedAddress.city = city;
        if (state) updatedAddress.state = state;
        if (pincode) updatedAddress.pincode = pincode;
        if (country) updatedAddress.country = country;

        user.address[addressIndex] = updatedAddress;

        await user.save();

        res.status(200).json({
            message: 'Address updated successfully',
            updatedAddress: user.address[addressIndex],
        });
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ message: 'Error updating address', error });
    }
};


const removeAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.session.user?.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressIndex = user.address.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }

        user.address.splice(addressIndex, 1);
        await user.save();

        res.status(200).json({ message: 'Address removed successfully' });
    } catch (error) {
        console.error('Error removing address:', error);
        res.status(500).json({ message: 'Error removing address', error });
    }
};


module.exports={
    checkOutPage,
    placeOrder,
    successOrderPage,
    addNewAddres,
    updateAddress,
    removeAddress
}