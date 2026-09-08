import "./ProductCard.css";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ArrowUpRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import imgFallback from "../../assets/images/product1.jpg";

/**
 * ProductCard — High-Fashion Luxury Editorial Catalogue Card.
 * Designed with Cormorant Garamond display typography, dual-image hover,
 * integrated glassmorphism wishlist control, and razor-sharp monochrome styling.
 */
const ProductCard = ({
  id,
  image,
  title,
  price,
  category,
  subCategory,
  brand,
  images,
  sizes,
  stock,
  product,
  badge,
  className = "",
}) => {
  const navigate = useNavigate();
  const { isProductWishlisted, toggleWishlist } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Normalize product attributes from either individual props or product object
  const prodId = id || product?._id || product?.id;
  const prodTitle = title || product?.name || product?.title || "SEEMZ Atelier Piece";
  const prodCategory = category || product?.category || "Collection";
  const prodSubCategory = subCategory || product?.subCategory || "";
  const prodBrand = brand || product?.brand || "SEEMZ";

  // Image extraction (primary & optional secondary hover image)
  const allImages = Array.isArray(images) && images.length > 0
    ? images
    : Array.isArray(product?.images) && product.images.length > 0
    ? product.images
    : [image || product?.image].filter(Boolean);

  const primaryImage = allImages[0] || image || product?.image || imgFallback;
  const secondaryImage = allImages.length > 1 ? allImages[1] : null;

  // Sizes & Stock
  const prodSizes = Array.isArray(sizes)
    ? sizes
    : Array.isArray(product?.sizes)
    ? product.sizes
    : [];

  const prodStock = stock !== undefined ? stock : product?.stock;

  // Price formatting
  const formatPrice = (val) => {
    if (typeof val === "number") {
      return `₹${val.toLocaleString("en-IN")}`;
    }
    if (typeof val === "string" && val.trim().length > 0) {
      if (val.startsWith("₹")) return val;
      const num = Number(val.replace(/[^0-9.-]+/g, ""));
      return !isNaN(num) && num > 0 ? `₹${num.toLocaleString("en-IN")}` : val;
    }
    return "";
  };

  const rawPriceVal = price !== undefined ? price : product?.price;
  const displayPrice = formatPrice(rawPriceVal);

  const wishlisted = isProductWishlisted(prodId);

  // Handle Wishlist Toggle
  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const productPayload = product || {
      _id: prodId,
      name: prodTitle,
      price: typeof rawPriceVal === "number" ? rawPriceVal : Number(String(rawPriceVal).replace(/[^0-9.-]+/g, "")) || 0,
      category: prodCategory,
      subCategory: prodSubCategory,
      images: allImages,
      sizes: prodSizes,
    };

    const res = await toggleWishlist(prodId, productPayload);
    if (res?.requireLogin) {
      navigate("/login");
    }
  };

  // Determine editorial category kicker
  const editorialKicker = prodSubCategory
    ? `${prodCategory.toUpperCase()} // ${prodSubCategory.toUpperCase()}`
    : prodCategory.toUpperCase();

  // Low stock badge if actual stock data is between 1 and 3
  const isLowStock = typeof prodStock === "number" && prodStock > 0 && prodStock <= 3;
  const displayBadge = badge || (isLowStock ? "LOW STOCK" : null);

  return (
    <article className={`seemz-product-card product-card ${className}`}>
      {/* ================= HERO IMAGE STAGE ================= */}
      <div className="product-image-wrap">
        <Link
          to={`/products/${prodId}`}
          className="product-image-link"
          aria-label={prodTitle}
        >
          {/* Primary Image */}
          <img
            src={primaryImage}
            alt={prodTitle}
            className={`product-primary-img ${imageLoaded ? "is-loaded" : ""}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />

          {/* Secondary Hover Image (if available in actual product data) */}
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${prodTitle} alternate perspective`}
              className="product-secondary-img"
              loading="lazy"
            />
          )}

          {/* Ambient Image Gradient Overlay */}
          <div className="product-image-overlay" />
        </Link>

        {/* Real Product Badge (e.g. Low Stock or Editorial Tag) */}
        {displayBadge && (
          <div className="product-badge-pill">
            <span>{displayBadge}</span>
          </div>
        )}

        {/* Wishlist Action Button */}
        <button
          type="button"
          className={`wishlist-btn ${wishlisted ? "active" : ""}`}
          aria-label={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          onClick={handleWishlistClick}
          title={wishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
        >
          <Heart
            size={16}
            fill={wishlisted ? "#ffffff" : "none"}
            stroke={wishlisted ? "#ffffff" : "#ffffff"}
            strokeWidth={wishlisted ? 0 : 1.8}
          />
        </button>
      </div>

      {/* ================= EDITORIAL METADATA ================= */}
      <Link
        to={`/products/${prodId}`}
        className="product-details-link"
      >
        <div className="product-details">
          {/* Editorial Category & Size Cue */}
          <div className="product-meta-header">
            <span className="product-category">
              {editorialKicker}
            </span>
            {prodSizes.length > 0 && (
              <span className="product-sizes-hint">
                {prodSizes.length} {prodSizes.length === 1 ? "SIZE" : "SIZES"}
              </span>
            )}
          </div>

          {/* Product Title (Cormorant Garamond) */}
          <h3 className="product-title-text" title={prodTitle}>
            {prodTitle}
          </h3>

          {/* Price & Action Affordance */}
          <div className="product-footer-row">
            <span className="product-price">
              {displayPrice}
            </span>
            <span className="product-explore-cue">
              EXPLORE <ArrowUpRight size={12} className="explore-arrow" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default ProductCard;