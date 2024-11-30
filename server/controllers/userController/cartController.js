const Product=require('../../models/admin/productModel')
const User=require('../../models/user/userModel')
const Cart=require('../../models/user/cartModel')

const cartRender = async (req, res) => {
    try {
        const userId = req.session?.user?.id;
        if(!userId) {return res.status(404).json({msg:"Please Login"}) }

        const cart = await Cart.findOne({ userId }).populate('items.productId'); 

        if (!cart || cart.items.length === 0) {
            return res.render('user/cartPage', { user: req.session.user, cartItems: [], totalAmount: 0 });
        }

        const totalAmount = cart.items.reduce((total, item) => total + item.total, 0);
        console.log(cart.items[0])
        res.render('user/cartPage', {
            user: req.session.user,
            cartItems: cart.items,
            totalAmount: totalAmount,
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

        const maxQtyPerUser = 10; // Max quantity allowed per user

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex === -1) {
            cart.items.push({ productId, quantity: 1, total: product.price });
        } else {
            const item = cart.items[itemIndex];

            if (item.quantity + 1 > maxQtyPerUser) {
                return res.status(400).json({
                    success: false,
                    message: `You can only add up to ${maxQtyPerUser} units of this product.`,
                });
            }

            item.quantity += 1;
            item.total += product.price;
        }

        await cart.save();
        return res.status(200).json({ success: true, message: `${product.name} added to cart.` });
    } catch (error) {
        console.error('Error adding to cart:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};


const removeFromCart=async (req,res) => {
    try {
        const userId=req.session.user?.id
        if (!userId) return res.status(401).json({ success: false, message: 'Please login' });

        const {productId}=req.body

        const cart=await Cart.findOne({userId})
        if(!cart) res.status(400).json({success:false,message:'Cart not found!'})

            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            if (itemIndex === -1) {
                return res.status(404).json({ success: false, message: 'Item not found in cart' });
            }
            
            cart.items.splice(itemIndex, 1);

            await cart.save()
            res.status(200).json({ success: true, message: 'Item removed successfully' });

    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}


const updateCartQuantity = async (req, res) => {
    try {
        const { id } = req.params; 
        const { quantity } = req.body;
        const userId = req.session?.user?.id;

        // Step 1: Ensure the user is logged in
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Please login' });
        }

        // Step 2: Retrieve the product details
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Step 3: Check if the requested quantity is within the max quantity per user limit
        const maxQtyPerUser = 10; // Max quantity allowed per user
        if (quantity > maxQtyPerUser) {
            return res.status(400).json({
                success: false,
                message: `You can only add up to ${maxQtyPerUser} units of this product.`,
            });
        }

        // Step 4: Retrieve the user's cart
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        // Step 5: Find the item in the cart
        const cartItem = cart.items.find(item => item.productId.toString() === id);
        if (!cartItem) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        // Step 6: Check stock availability based on the quantity difference
        const quantityDifference = quantity - cartItem.quantity;

        // If the user is increasing the quantity, check if the stock is sufficient
        if (quantityDifference > 0) {
            if (product.stock < quantityDifference) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock. Only ${product.stock} items available.`,
                });
            }
        }

        // Step 7: Update the cart item with the new quantity and total price
        cartItem.quantity = quantity;
        cartItem.total = product.price * quantity;

        // Step 8: Update the product stock based on the quantity change
        if (quantityDifference > 0) {
            // Reducing stock for an increase in quantity
            product.stock -= quantityDifference;
        } else {
            // Adding stock back for a decrease in quantity
            product.stock += Math.abs(quantityDifference);
        }

        // Step 9: Recalculate the grand total for the cart
        cart.grandTotal = cart.items.reduce((acc, item) => acc + item.total, 0);
        cart.totalAmount = cart.discount > 0 ? cart.grandTotal - cart.discount : cart.grandTotal;

        // Step 10: Save the updated cart and product data
        await cart.save();
        await product.save();

        // Step 11: Return the success response
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



module.exports={
    cartRender,
    addToCart,
    removeFromCart,
    updateCartQuantity
}