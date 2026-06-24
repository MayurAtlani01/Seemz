const mongoose=require("mongoose")

const connectDB= async()=>{
    await mongoose.connect("mongodb://localhost:27017/seemz")
    console.log(mongoose.connection.name);
    console.log("All systems are online")
}

module.exports=connectDB

