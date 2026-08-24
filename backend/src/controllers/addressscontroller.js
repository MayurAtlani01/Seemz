const Address = require("../models/address.model");

const addAddress = async (req, res) => {
  try {
    const { fullName, phone, address, city, state, country, pincode } = req.body;

    if (!fullName || !phone || !address || !city || !state || !country || !pincode) {
      return res.status(400).json({
        success: false,
        message: "All address fields are required",
      });
    }

    const newAddress = await Address.create({
      fullName,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address: newAddress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAddress = async (req, res) => {
  try {
    const addresses = await Address.find({
      user: req.user._id,
    }).sort({ _id: -1 });

    res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addAddress,
  getAddress,
  updateAddress,
  deleteAddress,
};