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
    phone: {
    type: String,
    default: ""
    },

    profilePic: {
    type: String,
    default: ""
    }
}, {
    timestamps: true
});


const User = mongoose.model("User", userSchema);

module.exports=User