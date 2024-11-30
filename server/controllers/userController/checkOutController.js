const Product=require('../../models/admin/productModel')
const User=require('../../models/user/userModel')
const Cart=require('../../models/user/cartModel')
const Order = require('../../models/user/orderMoel')

const checkOutPage=async (req,res) => {
    try {
        const userId=req.session.user?.id
        const user=await User.findById(userId)
        const address=user.address

        console.log(userId,'---------------------------------------');
        // const cart=await Cart.findOne({userId:userId})
        const cart = await Cart.findOne({ userId: userId }).populate('items.productId');
        console.log(cart,'=========================================');
        
        
       res.render('user/checkoutPage',{user,cart,address})

    } catch (error) {
        
    }
}

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
                status: 'Pending'
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
                    message: `Insufficient stock for ${product.name}. Only ${product.stock} items available.`
                });
            }
        }

        const newOrder = new Order({
            userId,
            userName: user.name,
            productItems,
            billingAddress,
            totalQuantity,
            originalPrice: cart.grandTotal,
            totalPrice: cart.totalAmount || cart.grandTotal,
            discount: cart.discount || 0,
            paymentMethod,
            paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
            status: 'Pending'
        });

        await newOrder.save();

        for (const item of cart.items) {
            const product = item.productId;
            product.stock -= item.quantity;
            await product.save();
        }

        await Cart.findOneAndUpdate({ userId }, { $set: { items: [], grandTotal: 0, discount: 0 } });

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

        const user = await User.findOne({
            'address._id': addressId  
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressIndex = user.address.findIndex(addr => addr._id.toString() === addressId);

        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }

        user.address[addressIndex] = {
            ...user.address[addressIndex], 
            street, 
            city, 
            state, 
            pincode, 
            country
        };

        await user.save();

        res.status(200).json({
            message: 'Address updated successfully',
            updatedAddress: user.address[addressIndex],
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating address', error });
    }
};


module.exports={
    checkOutPage,
    placeOrder,
    successOrderPage,
    addNewAddres,
    updateAddress
}