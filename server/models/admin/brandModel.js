const { name } = require('ejs')
const mongoose =require('mongoose')

const barndSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        default:Date.now
    },

})

const Brand=mongoose.model('Brand',barndSchema)

module.exports=Brand