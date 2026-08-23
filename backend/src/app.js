const express=require("express")
const authRoutes = require("./routes/authroutes");
const profileRoute = require("./routes/profileroutes");
const productRoutes= require("./routes/productroutes");
const cookieParser = require("cookie-parser");
const cartRoute = require("./routes/cartroutes")
const wishlistRoutes = require("./routes/wishlistroutes");
const addressRoutes = require("./routes/addressroutes");
const orderRoutes = require("./routes/orderRoutes");
const cors = require("cors");

const app=express()


app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.get("/",function(req,res){
    res.send("Seemz fashion")
})
app.use("/api/profile",profileRoute);
app.use("/api/auth", authRoutes);
app.use("/api/product",productRoutes);
app.use("/api/cart",cartRoute);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/orders", orderRoutes);

module.exports=app