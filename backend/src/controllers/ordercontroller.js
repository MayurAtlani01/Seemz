const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Address = require("../models/address.model");
const Product = require("../models/product.model");

const placeOrder = async (req, res) => {
  try {
    const { addressId } = req.body;

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Please select a delivery address",
      });
    }

    const address = await Address.findOne({
      _id: addressId,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Delivery address not found",
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      if (!item.product) {
        return res.status(404).json({
          success: false,
          message: "One or more products in your cart are no longer available",
        });
      }

      if (item.quantity > item.product.stock) {
        return res.status(400).json({
          success: false,
          message: `${item.product.name} has only ${item.product.stock} items left in stock`,
        });
      }

      totalAmount += item.product.price * item.quantity;
      orderItems.push({
        product: item.product._id,
        quantity: item.quantity,
        size: item.size || "",
      });
    }

    // Decrement stock for all purchased items
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      address: address._id,
      totalAmount,
      paymentMethod: "COD",
      orderStatus: "Pending",
    });

    // Empty the user's cart in database
    cart.items = [];
    await cart.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("items.product")
      .populate("address");

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    })
      .populate("items.product")
      .populate("address")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSingleOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate("items.product")
      .populate("address");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product")
      .populate("address")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const cancelOrderAdmin = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    order.orderStatus = "Cancelled";
    await order.save();

    // Restore stock for each item in the cancelled order
    for (const item of order.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.product")
      .populate("address");

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deliverOrderAdmin = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.orderStatus === "Delivered" || order.orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: `Order cannot be marked as Delivered when it is already ${order.orderStatus}`,
      });
    }

    order.orderStatus = "Delivered";
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.product")
      .populate("address");

    res.status(200).json({
      success: true,
      message: "Order marked as Delivered successfully",
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const cancelMyOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // SECURITY CHECK: Verify authenticated user ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access Denied. You are not authorized to cancel this order.",
      });
    }

    // VALIDATION: Check active statuses (only allow Pending/Confirmed)
    if (order.orderStatus === "Shipped" || order.orderStatus === "Delivered" || order.orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order at this stage. Current status is ${order.orderStatus}.`,
      });
    }

    order.orderStatus = "Cancelled";
    await order.save();

    // Restore stock for each item in the cancelled order
    for (const item of order.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    const populatedOrder = await Order.findById(order._id)
      .populate("items.product")
      .populate("address");

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getSingleOrder,
  getAllOrdersAdmin,
  cancelOrderAdmin,
  deliverOrderAdmin,
  cancelMyOrder,
};