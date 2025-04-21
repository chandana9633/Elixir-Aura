const User = require('../../models/user/userModel');
const Product = require('../../models/admin/productModel');
const Wishlist = require('../../models/user/wishlistModel');

const wishlistPage = async (req, res) => {
    try {
        const userId = req.session?.user?.id;
        if (!userId) {
            return res.status(401).render('user/wishlistPage', { user: null, wishlist: [] });
        }

        const user = req.session.user;
        const wishlist = await Wishlist.findOne({ userId }).populate('products');

        res.render('user/wishlist', {
            user,
            wishlist: wishlist?.products || [],
        });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).render('user/wishlist', { user: null, wishlist: [] });
    }
};

const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        console.log(productId,'wishhhhhhhhh');
        
        const userId = req.session?.user?.id;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }
        
        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            wishlist = new Wishlist({ userId, products: [] });
        }

        const isExist = wishlist.products.includes(productId);
        if (isExist) {
            wishlist.products.pull(productId);
        } else {
            wishlist.products.push(productId);
        }

        await wishlist.save();

        res.status(200).json({ success: true, wishlist: wishlist.products });
    } catch (error) {
        console.error('Error updating wishlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const removeWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session?.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }

        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found' });
        }

        const productIndex = wishlist.products.indexOf(productId);
        if (productIndex > -1) {
            wishlist.products.splice(productIndex, 1);
            await wishlist.save();
            res.status(200).json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Product not found in wishlist' });
        }
    } catch (error) {
        console.error('Error removing item from wishlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    wishlistPage,
    addToWishlist,
    removeWishlist,
};
