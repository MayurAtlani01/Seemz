import "./ProductCard.css";
import { Link } from "react-router-dom";

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
        to={`/product/${id}`}
        className="product-link"
      >
        <div className="product-image">
          <img
            src={image}
            alt={title}
          />

          <div className="product-overlay">
            <button className="quick-view">
              Quick View
            </button>
          </div>
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