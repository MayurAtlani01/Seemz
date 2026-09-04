import "./ProductCard.css";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const ProductCard = ({
  id,
  image,
  title,
  price,
  category,
}) => {
  const navigate = useNavigate();
  const { isProductWishlisted, toggleWishlist } = useAuth();
  const wishlisted = isProductWishlisted(id);

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const res = await toggleWishlist(id, {
      _id: id,
      name: title,
      price,
      category,
      images: [image],
    });

    if (res?.requireLogin) {
      navigate("/login");
    }
  };

  return (
    <div className="product-card">
      <div className="product-image-wrap">
        <Link
          to={`/products/${id}`}
          className="product-image-link"
          aria-label={title}
        >
          <img
            src={image}
            alt={title}
            loading="lazy"
          />
        </Link>

        <button
          type="button"
          className={`wishlist-btn ${wishlisted ? "active" : ""}`}
          aria-label={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          onClick={handleWishlistClick}
        >
          <Heart
            size={18}
            fill={wishlisted ? "#000000" : "none"}
            stroke={wishlisted ? "#000000" : "#ffffff"}
          />
        </button>
      </div>

      <Link
        to={`/products/${id}`}
        className="product-details-link"
      >
        <div className="product-details">
          <p className="product-category">
            {category}
          </p>

          <h3 className="product-title-text">{title}</h3>

          <span className="product-price">
            {price}
          </span>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;