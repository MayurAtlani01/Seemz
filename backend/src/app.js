const express = require("express");
const authRoutes = require("./routes/authroutes");
const profileRoute = require("./routes/profileroutes");
const productRoutes = require("./routes/productroutes");
const cookieParser = require("cookie-parser");
const cartRoute = require("./routes/cartroutes");
const wishlistRoutes = require("./routes/wishlistroutes");
const addressRoutes = require("./routes/addressroutes");
const orderRoutes = require("./routes/orderroutes");
const chatRoute = require("./routes/chatroutes");
const cors = require("cors");

const app = express();

app.set("trust proxy", 1);
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://seemz.vercel.app",
  process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, "") : null,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, "");
      
      let isAllowed = allowedOrigins.includes(normalized);
      if (!isAllowed) {
        try {
          const parsed = new URL(origin);
          if (parsed.hostname.endsWith(".vercel.app") || parsed.hostname === "localhost") {
            isAllowed = true;
          }
        } catch {
          // If URL parsing fails, check substring safely
          if (normalized.includes(".vercel.app") || normalized.includes("localhost")) {
            isAllowed = true;
          }
        }
      }
      return callback(null, isAllowed);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With", "Accept"],
    exposedHeaders: ["Set-Cookie"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Liveness & health check endpoints for cloud monitoring and wakeups
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get("/", function(req, res) {
  res.send("Seemz fashion backend active");
});

app.use("/api/profile", profileRoute);
app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoute);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/chat", chatRoute);

// Global fallback 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("[SERVER] Unhandled route error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
