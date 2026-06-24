const getProfile = async (req, res) => {
    try {

        return res.status(200).json({
            success: true,
            user: {
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone,
                profilePic: req.user.profilePic
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

        const { name, phone, profilePic } = req.body;

        if (name) req.user.name = name;
        if (phone) req.user.phone = phone;
        if (profilePic) req.user.profilePic = profilePic;

        await req.user.save();

        return res.status(200).json({
            success: true,
            message: "Profile Updated Successfully",
            user: {
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone,
                profilePic: req.user.profilePic
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