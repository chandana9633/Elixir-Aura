const mongoose=require('mongoose')
const User=require('../../models/user/userModel')
const Product=require('../../models/admin/productModel')


const cartSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    couponId:{
      type: mongoose.Schema.Types.ObjectId,
    //   ref:Coupon
    },
    items:
      [{
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: Product
        },
        quantity: {
          type: Number,
          default: 0
        },
        // stock: { 
        //   type: Number,
        //    required: true 
        //   },
        total: {
          type: Number,
          default:0
  
        },
        offerPrice: {
          type: Number,
          required: false
        }
      }],
    grandTotal: {
      type: Number,
      default:0
    },
    discount: {
      type: Number,
      default: 0
    },
    totalAmount:{
      type:Number
    },
    couponDiscount:{
      type:Number,
      default: 0
    }
  });

const Cart=mongoose.model('Cart',cartSchema)

module.exports=Cart