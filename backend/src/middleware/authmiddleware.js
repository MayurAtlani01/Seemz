const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protect = async (req, res, next) => {
    try {

        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not Authorized"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found or session expired"
            });
        }

        req.user = user;

        next();

    } catch (error) {
            console.log(error);
        return res.status(401).json({
            success: false,
            message: "Invalid Token"
        });

    }
};

module.exports = protect;