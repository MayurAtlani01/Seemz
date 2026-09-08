const cloudinary = require("../config/cloudinary");

const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        profilePic: req.user.profilePic,
        bodyProfile: req.user.bodyProfile,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, profilePic, bodyProfile } = req.body;

    if (name) req.user.name = name;
    if (phone !== undefined) req.user.phone = phone;
    if (profilePic !== undefined) req.user.profilePic = profilePic;
    if (bodyProfile) req.user.bodyProfile = bodyProfile;

    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        profilePic: req.user.profilePic,
        bodyProfile: req.user.bodyProfile,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image file to upload",
      });
    }

    let avatarUrl = "";

    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      try {
        avatarUrl = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "seemz_avatars",
              resource_type: "image",
              transformation: [
                { width: 500, height: 500, crop: "fill", gravity: "face" },
                { quality: "auto", fetch_format: "auto" },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          uploadStream.end(req.file.buffer);
        });
      } catch (cloudErr) {
        console.warn("[Profile] Cloudinary upload exception, falling back to base64:", cloudErr.message);
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        avatarUrl = `data:${req.file.mimetype};base64,${b64}`;
      }
    } else {
      // Resilient fallback: base64 Data URI
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      avatarUrl = `data:${req.file.mimetype};base64,${b64}`;
    }


    req.user.profilePic = avatarUrl;
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      profilePic: req.user.profilePic,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        profilePic: req.user.profilePic,
        bodyProfile: req.user.bodyProfile,
      },
    });
  } catch (error) {
    console.error("[Profile] Avatar upload error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload profile photo",
    });
  }
};

const removeAvatar = async (req, res) => {
  try {
    req.user.profilePic = "";
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo removed successfully",
      profilePic: "",
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        profilePic: "",
        bodyProfile: req.user.bodyProfile,
      },
    });
  } catch (error) {
    console.error("[Profile] Avatar remove error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove profile photo",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  removeAvatar,
};