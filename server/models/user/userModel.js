const mongoose=require("mongoose")

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String
    },
    status:{
        type:String,
        default:'Active'
    },
    googleId:{
       type: String,
       required:false
    },
    address:[{
        street:String,
        city:String,
        state:String,
        pincode:String,
        country:String,
        phone:Number,
        addressType:String

    }],
    image:{
        type:String
    },
},{
    timestamps:true
})

const User=mongoose.model("userDB",userSchema)

module.exports=User