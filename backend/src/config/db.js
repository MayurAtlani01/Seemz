const dns = require("node:dns");
const mongoose = require("mongoose");

const mongooseOptions = {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
};

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.error("[DB] CRITICAL: MONGO_URI environment variable is missing.");
        process.exit(1);
    }

    try {
        if (process.env.CUSTOM_DNS) {
            try {
                dns.setServers(process.env.CUSTOM_DNS.split(",").map(s => s.trim()));
            } catch (e) {
                console.warn("[DB] Custom DNS configuration error:", e.message);
            }
        } else {
            try {
                dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
            } catch (e) {
                // Ignore if not supported
            }
        }
        await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
        console.log("[DB] MongoDB Connected Successfully");
    } catch (error) {
        console.warn("[DB] MongoDB primary connect failed:", error.message, "- Retrying with alternate DNS...");
        try {
            dns.setServers(["8.8.8.8", "1.1.1.1"]);
            await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
            console.log("[DB] MongoDB Connected Successfully (via fallback DNS)");
            return;
        } catch (fallbackError) {
            console.error("[DB] MongoDB Connection Error:", fallbackError.message);
            process.exit(1);
        }
    }
};

module.exports = connectDB;