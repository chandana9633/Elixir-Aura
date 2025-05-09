const mongoose = require('mongoose');
const Category = require('../../models/admin/categoryModel')
const CategoryOffer = require('../../models/admin/categoryOfferModel')

const productSchema = new mongoose.Schema({
     name: {
          type: String,
          required: true
     },
     description: {
          type: String
     },
     category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category'
     },
     categoryOffer: {
          type:Number,
          ref: 'CategoryOffer'
     },
     categoryOfferEndDate: {
          type: String
     },
     image: {
          type: Array,
          required: true
     },
     date: {
          type: Date
     },
     stock: {
          type: Number,
          required: true
     },
     price: {
          type: Number
     },
     specification: {
          type: String
     },
     // specification: {
     //     type: String, 
     //     required: true,
     //     enum: ["30", "40", "50", "60", "70", "80", "90", "100"], 
     // },
     status: {
          type: String,
          default: 'Active'
     },
     discountprice: {
          type: Number,
          required: false
     },
         discountexpiryDate: {
              type: Date 
         },
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
