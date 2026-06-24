const Product = require("../models/product.model");

const createProduct = async (req, res) => {
  try {
    const {
      name,
      brand,
      description,
      price,
      category,
      subCategory,
      images,
      sizes,
      stock,
    } = req.body;

    const product = await Product.create({
      name,
      brand,
      description,
      price,
      category,
      subCategory,
      images,
      sizes,
      stock,
    });

    return res.status(201).json({
      success: true,
      message: "Product Created Successfully",
      product,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
const getProducts = async (req, res) => {
    try {

        const products = await Product.find();

        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const getProductById = async (req, res) => {
    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product Not Found"
            });
        }

        return res.status(200).json({
            success: true,
            product
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
const updateProduct = async (req, res) => {
    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product Not Found"
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "Product Updated Successfully",
            product: updatedProduct
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
const deleteProduct = async (req, res) => {
    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product Not Found"
            });
        }

        await Product.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Product Deleted Successfully"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
module.exports = {
    createProduct,
    getProducts,getProductById,updateProduct,deleteProduct
};