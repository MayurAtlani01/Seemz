require("dotenv").config();
const app=require("./app")
const connectDB=require("./config/db")

connectDB()

const PORT = process.env.PORT || 3000;

app.listen(PORT, function(){
    console.log(`Server running on port ${PORT}. Welcome captain`);
});