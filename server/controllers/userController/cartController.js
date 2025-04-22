const Product = require('../../models/admin/productModel')
const User = require('../../models/user/userModel')
const Cart = require('../../models/user/cartModel')
const CategoryOffer = require('../../models/admin/categoryOfferModel')


const cartRender = async (req, res) => {
    try {
        const userId = req.session?.user?.id;
        console.log('user id',userId)
        if (!userId) {
            return res.status(404).json({ msg: "Please Login" });
        }

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.render('user/cartPage', { user: req.session.user, cartItems: [], totalAmount: 0 });
        }

        const currentDate = new Date();

        const categoryIds = cart.items.map(item => item.productId.category._id);
        const categoryOffers = await CategoryOffer.find({
            categoryId: { $in: categoryIds },
            endDate: { $gte: currentDate }
        });

        const offersMap = categoryOffers.reduce((map, offer) => {
            map[offer.categoryId] = offer.discountPercentage;
            return map;
        }, {});

        let totalAmount = 0;
        if (cart?.couponId) {
            cart.totalAmount = totalAmount - cart.couponDiscount;
            totalAmount -= cart.couponDiscount
        }


        await cart.save();

        res.render('user/cartPage', {
            user: req.session.user,
            cartItems: cart.items,
            totalAmount: cart.totalAmount,
        });

    } catch (error) {
        console.error('Error rendering cart page:', error);
        res.status(500).send('Server error');
    }
};



const addToCart = async (req, res) => {
    try {
        const userId = req.session?.user?.id;
        if (!userId) return res.status(404).json({ success: false, message: 'Please Login' });

        const { productId } = req.body;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const maxQtyPerUser = 10;
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId.toString());

        let discountPercentage = 0;
        if (product.discountprice) {
            discountPercentage = product.discountprice
        } else if (product.categoryOffer) {
            discountPercentage = product.categoryOffer;
        }

        let offerPrice = 0;
        if (discountPercentage) {
            offerPrice = Math.round(product.price - (product.price * (discountPercentage / 100)));
        }

        if (itemIndex === -1) {
            cart.items.push({
                productId,
                quantity: 1,
                offerPrice: offerPrice,
                total: product.price,
                actualPrice: product.price
            });
        } else {
            const item = cart.items[itemIndex];

            if (item.quantity + 1 > maxQtyPerUser) {
                return res.status(400).json({
                    success: false,
                    message: `You can only add up to ${maxQtyPerUser} units of this product.`,
                });
            }

            item.quantity += 1;
            item.total = product.price * item.quantity;
            item.offerPrice += offerPrice
        }

        let grandTotal = 0
        let discount = 0

        for (let item of cart.items) {
            grandTotal += item.total
            discount += item.offerPrice

        }

        cart.grandTotal = grandTotal
        cart.discount = grandTotal - discount
        cart.totalAmount = discount

        await cart.save();
        return res.status(200).json({ success: true, message: `${product.name} added to cart.` });

    } catch (error) {
        console.error('Error adding to cart:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        if (!userId) {
            console.error('User not logged in');
            return res.status(401).json({ success: false, message: 'Please login' });
        }

        const { productId } = req.body;
        // console.log(productId, 'productId');

        if (!productId) {
            console.error('No Product ID provided');
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart) {
            console.error('Cart not found for user:', userId);
            return res.status(400).json({ success: false, message: 'Cart not found!' });
        }

        console.log('Cart Items:', JSON.stringify(cart.items, null, 2));

        const itemIndex = cart.items.findIndex(
            item => item.productId._id.toString() === productId
        );

        if (itemIndex === -1) {
            console.error('Item not found in cart for product ID:', productId);
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        const removedItem = cart.items[itemIndex];
        cart.items.splice(itemIndex, 1);
        cart.totalAmount = cart.items.reduce((acc, item) => acc + item.productId.price * item.quantity, 0);

        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Item removed successfully',
            cart,
        });
    } catch (error) {
        console.error('Error removing item from cart:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



const updateCartQuantity = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const userId = req.session?.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Please login' });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const maxQtyPerUser = 10;
        if (quantity > maxQtyPerUser) {
            return res.status(400).json({
                success: false,
                message: `You can only add up to ${maxQtyPerUser} units of this product.`,
            });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const cartItem = cart.items.find(item => item.productId.toString() === id);
        if (!cartItem) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        const quantityDifference = quantity - cartItem.quantity;

        if (quantityDifference > 0) {
            if (product.stock < quantityDifference) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock. Only ${product.stock} items available.`,
                });
            }
        }

        let discountPercentage = 0;
        if (product.discountprice) {
            discountPercentage = product.discountprice
        } else if (product.categoryOffer) {
            discountPercentage = product.categoryOffer;
        }

        let offerPrice = 0;
        if (discountPercentage) {
            offerPrice = Math.round(product.price - (product.price * (discountPercentage / 100)));
        }

        cartItem.quantity = quantity; 
        cartItem.total = product.price*quantity 
        cartItem.offerPrice = offerPrice * quantity

        let grandTotal = 0
        let discount = 0

        for (let item of cart.items) {
            grandTotal += item.total
            discount += item.offerPrice

        }

        cart.grandTotal = grandTotal
        cart.discount = grandTotal - discount
        cart.totalAmount = discount


        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'Cart updated successfully',
            cart,
        });
    } catch (error) {
        console.error('Error updating cart quantity:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};




const clearCart = async (req, res) => {
    try {
        const userId = req.session.user.id
        const cart = await Cart.findOne({ userId })

        // console.log(userId, cart, 'userId','cart');

        if (cart) {
            cart.items = []
            cart.grandTotal = 0
            cart.discount = 0
            cart.totalAmount = 0
            cart.couponDiscount = 0
            await cart.save()
        }
        req.session.message = 'Your cart has been cleared'
        res.status(200).json({ success: true, message: 'cart cleared successfully' })
    } catch (error) {
        console.error('the error on the clear cart side:', error)
        res.status(500).json({ success: false, message: 'server error' })
    }
}


module.exports = {
    cartRender,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart
}