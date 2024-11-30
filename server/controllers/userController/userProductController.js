const Product = require('../../models/admin/productModel');
const Category=require('../../models/admin/categoryModel')

const loadProductPage = async (req, res) => {
    try {
        const productId = req.params.id;
        const user = req.session.user;
        
        const pro = await Product.findById(productId).populate('category');
        
        if (!pro) {
            return res.status(404).send("Product not found");
        }
        
        const relatedProducts = await Product.find({
            _id: { $ne: productId },
            category: pro.category._id,
        }).limit(4);

        console.log("Related Products:", relatedProducts);
        res.render('user/productPage', {
            pro,
            user,
            relatedProducts
         });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
};

const loadShopPage = async (req, res) => {
    try {
        const user = req.session.user;
        const { category, priceRange, sort } = req.query; 

        const categories = await Category.find();

        const query = {};

        if (category) {
            query.category = category;
        }

        if (priceRange) {
            if (priceRange === 'under1000') {
                query.price = { $lt: 1000 }; 
            } else if (priceRange === '1000-1500') {
                query.price = { $gte: 1000, $lte: 1500 };
            } else if (priceRange === 'above1500') {
                query.price = { $gt: 1500 }; 
            }
        }
        

        let sortQuery = {};

        if (sort) {
            switch (sort) {
                case 'popularity':
                    sortQuery = { "popularity": -1 }; 
                    break;
                case 'priceLowToHigh':
                    sortQuery = { "price": 1 };
                    break;
                case 'priceHighToLow':
                    sortQuery = { "price": -1 }; 
                    break;
                case 'avgRatings':
                    sortQuery = { "averageRating": -1 };
                    break;
                case 'featured':
                    sortQuery = { "featured": -1 }; 
                    break;
                case 'aToZ':
                    sortQuery = { "name": 1 }; 
                    break;
                case 'zToA':
                    sortQuery = { "name": -1 };
                    break;
                default:
                    sortQuery = {}; 
            }
        }

        const products = await Product.find(query).populate('category').sort(sortQuery);

        res.render('user/shopPage', { user, categories, products });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


module.exports = {
    loadProductPage,
    loadShopPage
};
