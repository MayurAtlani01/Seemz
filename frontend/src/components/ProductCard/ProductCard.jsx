import "./ProductCard.css";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const ProductCard = ({
  id,
  image,
  title,
  price,
  category,
}) => {
  return (
    <div className="product-card">

      <Link
        to={`/products/${id}`}
        className="product-link"
      >

        <div className="product-image">

          <img
            src={image}
            alt={title}
          />

          <button
            type="button"
            className="wishlist-btn"
            aria-label="Add to Wishlist"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Heart size={18} />
          </button>

        </div>

        <div className="product-details">

          <p className="product-category">
            {category}
          </p>

          <h3>{title}</h3>

          <span className="product-price">
            {price}
          </span>

        </div>

      </Link>

    </div>
  );
};

export default ProductCard;