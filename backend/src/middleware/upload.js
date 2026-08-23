const multer = require("multer");

// Memory storage to hold files in buffer for direct stream/upload to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 6, // max 6 images
  },
  fileFilter,
});

module.exports = upload;
