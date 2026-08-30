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
                bodyProfile: req.user.bodyProfile
            }
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Server Error"
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
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone,
                profilePic: req.user.profilePic,
                bodyProfile: req.user.bodyProfile
            }
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};
module.exports = {
    getProfile,updateProfile
};