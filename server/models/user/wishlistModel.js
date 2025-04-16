const mongoose = require('mongoose');
const User=require('../../models/user/userModel')
const Product=require('../../models/admin/productModel')

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: Product
    }],
  
})


const Wishlist=mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist