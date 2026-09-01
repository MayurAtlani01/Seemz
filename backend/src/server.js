require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { verifyEmailConfig } = require("./services/emailService");

// Handle uncaught errors gracefully without silent process hangs
process.on("unhandledRejection", (reason) => {
  console.error("[PROCESS] Unhandled Promise Rejection:", reason?.message || reason);
});

process.on("uncaughtException", (error) => {
  console.error("[PROCESS] Uncaught Exception:", error.message);
});

connectDB()
  .then(async () => {
    // 1. Verify Email Provider configuration on startup
    verifyEmailConfig().catch(() => {});

    // 2. Run any schema migrations
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
  })
  .catch((err) => {
    console.error("[DB] Initial DB startup connection failed:", err.message);
  });

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log(`[SERVER] Seemz API running on port ${PORT}. Environment: ${process.env.NODE_ENV || "development"}`);
});