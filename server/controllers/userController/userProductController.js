const Product = require('../../models/admin/productModel');
const Category=require('../../models/admin/categoryModel')
const Cart=require('../../models/user/cartModel')
const CategoryOffer=require('../../models/admin/categoryOfferModel')
const Wishlist=require('../../models/user/wishlistModel')



const loadProductPage = async (req, res) => {
    try {
        const productId = req.params.id;
        const user = req.session.user;
        const userId=req.session.user?.id

        
        const pro = await Product.findById(productId).populate('category');
        
        if (!pro) {
            return res.status(404).send("Product not found");
        }

        const relatedProducts = await Product.find({
            _id: { $ne: productId },
            category: pro.category._id,
        }).limit(4);

        let categoryOffer = null;
        const currentDate = new Date();
        

        let wishlistProducts = [];
        if (userId) {
            const wishlist = await Wishlist.findOne({ userId }).populate('products');
            if (wishlist) {
                wishlistProducts = wishlist.products.map(product => product._id.toString());
            }
        } 
        
        res.render('user/productPage', {
            pro,
            user,
            relatedProducts,
            wishlistProducts
        });
        
    } catch (error) {
        console.error("Error loading product page:", error);
        res.status(500).send("Server error");
    }
};


const loadShopPage = async (req, res) => {
    try {
        const user = req.session.user;
        const userId=req.session.user?.id

        const { category, priceRange, sort, page = 1 } = req.query; 
        const limit = 9; 
        const skip = (page - 1) * limit;

        const categories = await Category.find();

        const query = { status: 'Active' };

        if (category) {
            query.category = category;
        }

        if (priceRange) {
            const priceConditions = {
                under1000: { $lt: 1000 },
                '1000-1500': { $gte: 1000, $lte: 1500 },
                above1500: { $gt: 1500 }
            };
            query.price = priceConditions[priceRange];
        }

        const sortOptions = {
            popularity: { popularity: -1 },
            priceLowToHigh: { price: 1 },
            priceHighToLow: { price: -1 },
            avgRatings: { averageRating: -1 },
            featured: { featured: -1 },
            aToZ: { name: 1 },
            zToA: { name: -1 }
        };
        const sortQuery = sort ? sortOptions[sort] : {};

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        const products = await Product.find(query)
            .populate('category')
            .sort(sortQuery)
            .skip(skip)
            .limit(limit);


            let wishlistProducts = [];
            if (userId) {
                const wishlist = await Wishlist.findOne({ userId }).populate('products');
                if (wishlist) {
                    wishlistProducts = wishlist.products.map(product => product._id.toString());
                }
            }

            let selectedCategory = query.category ? query.category : "";
            console.log(query)
            console.log(selectedCategory)
        res.render('user/shopPage', { 
            user, 
            categories, 
            products, 
            wishlistProducts,
            currentPage: parseInt(page), 
            totalPages ,
            selectedCategory
        });
    } catch (error) {
        console.error('Error loading shop page:', error);
        res.status(500).send('Server Error');
    }
};


// const SearchingProduct = async (req, res) => {
//     try {
//         const { query } = req.query;

//         const normalizedQuery = query.trim().replace(/\s+/g, ' ');

//         const searchOptions = {
//             status: 'Active',
//             $or: [
//                 { name: { $regex: normalizedQuery, $options: 'i' } },
//                 { productName: { $regex: normalizedQuery.split(' ').join('.*'), $options: 'i' } }
//             ]
//         };

//         const products = await Product.find(searchOptions).populate('category');

//         res.json({ success: true, count: products.length, products });
//     } catch (error) {
//         console.error('Error in searching products:', error);
//         res.status(500).json({ success: false, message: 'Error searching products', error: error.message });
//     }
// };



const SearchingProduct = async (req, res) => {
    try {
        const { query = '', category = '', page = 1 } = req.query;
        const perPage = 6; 
        const skip = (page - 1) * perPage;

        const normalizedQuery = query.trim().replace(/\s+/g, ' ');

        const filter = {
            status: 'Active',
            $or: [
                { name: { $regex: normalizedQuery, $options: 'i' } },
                { productName: { $regex: normalizedQuery.split(' ').join('.*'), $options: 'i' } }
            ]
        };

        if (category) {
            filter.category = category;
        }

        const total = await Product.countDocuments(filter);
        const totalPages = Math.ceil(total / perPage);

        const products = await Product.find(filter)
            .populate('category')
            .skip(skip)
            .limit(perPage);
        
        res.json({ success: true, products, totalPages });
    } catch (error) {
        console.error('Error in searching products:', error);
        res.status(500).json({ success: false, message: 'Error searching products', error: error.message });
    }
};


const addCart = async (req, res) => {
    try {
        const userId = req.session?.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Please login to add items to your cart.' });
        }

        const { productId } = req.body;
        const product = await Product.findById(productId).populate('category');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        const maxQtyPerUser = 10;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const itemIndex = cart.items.findIndex(item =>
            item.productId.toString() === product._id.toString()
        );

        let discountPercentage = 0;

        if (product.discountprice) {
            discountPercentage = product.discountprice;
        }

        if (product.categoryOfferamount && product.categoryOfferamount > discountPercentage) {
            discountPercentage = product.categoryOfferamount;
        }

        const discountedPrice = Math.round(product.price - (product.price * discountPercentage / 100));

        if (itemIndex === -1) {
            cart.items.push({
                productId: product._id,
                quantity: 1,
                offerPrice: discountedPrice,
                total: product.price,
                actualPrice: product.price
            });
        } else {
            const item = cart.items[itemIndex];

            if (item.quantity >= maxQtyPerUser) {
                return res.status(400).json({
                    success: false,
                    message: `You can only add up to ${maxQtyPerUser} units of this product.`,
                });
            }

            item.quantity += 1;
            item.total = product.price * item.quantity;
            item.offerPrice = discountedPrice * item.quantity;
        }

        // Recalculate cart totals
        let grandTotal = 0;
        let discountedTotal = 0;

        for (const item of cart.items) {
            grandTotal += item.total;
            discountedTotal += item.offerPrice;
        }

        cart.grandTotal = grandTotal;
        cart.discount = grandTotal - discountedTotal;
        cart.totalAmount = discountedTotal;

        await cart.save();

        return res.status(200).json({ success: true, message: `${product.name} added to cart.` });
    } catch (error) {
        console.error('Error adding to cart:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};



const addWishlist=async (req,res) => {
    try {
        const userId = req.session?.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Please login to manage your wishlist.' });

        const { productId } = req.body;

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
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

module.exports = {
    loadProductPage,
    loadShopPage,
    SearchingProduct,
    addCart,
    addWishlist

};
