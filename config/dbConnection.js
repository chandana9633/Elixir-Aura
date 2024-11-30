const mongoose=require("mongoose")

const conncectDB=async () => {
    try {
        await mongoose.connect(process.env.DB_URI,{
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        })
        console.log("DB connected !");
        
    } catch (error) {
        console.log("DB error!!!",error);
        process.exit(1)
    }
}

module.exports=conncectDB
