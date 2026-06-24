const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt=require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");

//REGISTER CONTROLLER

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


//LOGIN CONTROLLER
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

   
        const user = await User.findOne({ email });

        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User does not exist"
            });
        }

       
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials"
            });
        }
    const token = jwt.sign(
    {
        id: user._id
    },
    process.env.JWT_SECRET,
    {
        expiresIn: "7d"
    }
);

res.cookie("token", token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
});
        
        res.status(200).json({
            success: true,
            message: "Login Successful",
            token
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

// LOG OUT CONTROLLER
const logoutUser = async (req, res) => {
    try {

        res.clearCookie("token");

        res.status(200).json({
            success: true,
            message: "Logged Out Successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};

// PASSWORD RESET CONTROLLER

const forgotPassword = async (req, res) => {
    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User does not exist"
            });
        }

        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });

        user.otp = otp;
        user.otpExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        res.status(200).json({
            success: true,
            message: "OTP generated successfully",
            otp // testing 
        });
        console.log(process.env.EMAIL_USER);
        console.log(process.env.EMAIL_PASS);
        
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Seemz Password Reset OTP",
    text: `
Hello ${user.name},

We received a request to reset your Seemz account password.

Your One-Time Password (OTP) is: ${otp}

This OTP is valid for 10 minutes.

If you did not request a password reset, please ignore this email.

Regards,
Team Seemz
    `
});

res.status(200).json({
    success: true,
    message: "OTP sent successfully"
});

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};

// VERIFY AND RESET CONTROLLER

const resetPassword = async (req, res) => {
    try {

        const { email, otp, newPassword } = req.body;

        
        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User does not exist"
            });
        }

        
        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        
        if (user.otpExpire < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP Expired"
            });
        }

        
        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        user.password = hashedPassword;

        user.otp = null;
        user.otpExpire = null;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password Reset Successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};
module.exports = {
    registerUser,loginUser,logoutUser,forgotPassword,resetPassword
};