const mongoose=require("mongoose")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
     otp: {
        type: String,
        default: null
    },

    otpExpire: {
        type: Date,
        default: null
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    otpLastSent: {
        type: Date,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    phone: {
    type: String,
    default: ""
    },

    profilePic: {
    type: String,
    default: ""
    },
    bodyProfile: {
        gender: { type: String, enum: ["men", "women"], default: "men" },
        height: { type: Number, default: 175 },
        shoulderWidth: { type: Number, default: 44 },
        chest: { type: Number, default: 96 },
        waist: { type: Number, default: 80 },
        hip: { type: Number, default: 94 },
        armLength: { type: Number, default: 60 },
        inseam: { type: Number, default: 80 },
        torsoLength: { type: Number, default: 65 },
        avatarParams: {
            height: { type: Number, default: 50 },
            weight: { type: Number, default: 50 },
            muscle: { type: Number, default: 50 },
            proportions: { type: Number, default: 50 }
        }
    }
}, {
    timestamps: true
});


const User = mongoose.model("User", userSchema);

module.exports=User