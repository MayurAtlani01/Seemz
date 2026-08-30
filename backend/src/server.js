require("dotenv").config();
const app=require("./app")
const connectDB=require("./config/db")

connectDB().then(async () => {
    try {
        const User = require("./models/user.model");
        const result = await User.updateMany(
            { isVerified: { $exists: false } },
            { $set: { isVerified: true } }
        );
        if (result.modifiedCount > 0) {
            console.log(`[Migration] Auto-verified ${result.modifiedCount} pre-existing user accounts.`);
        }
    } catch (err) {
        console.error("[Migration] Account verification check failed:", err.message);
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, function(){
    console.log(`Server running on port ${PORT}. Welcome captain`);
});