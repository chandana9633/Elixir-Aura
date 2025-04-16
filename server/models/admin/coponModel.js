const mongoose=require('mongoose')

const coponSchema=new mongoose.Schema({
    coponName:{
        type:String,
        required:true
    },
    coponCode:{
        type:String,
        required:true
    },
    startDate:{
        type:Date,
        required:true
    },
    expiryDate:{
        type:Date,
        required:true
    },
    discountPercentage:{
        type:Number,
        required:true
    },
    maxAmount:{
        type: Number,
        required: true
    }
})


coponSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });
const Copon=mongoose.model('coupons',coponSchema)

module.exports=Copon