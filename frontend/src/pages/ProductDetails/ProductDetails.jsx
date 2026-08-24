import "./ProductDetails.css";
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, ArrowLeft, Check, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { getProductById } from "../../services/productservices";
import { useAuth } from "../../context/AuthContext";
import imgFallback from "../../assets/images/product1.jpg";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isProductWishlisted, toggleWishlist, addToCart } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedImage, setSelectedImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartError, setCartError] = useState("");

  const isWishlisted = isProductWishlisted(id);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProductById(id);
        if (data?.success && data?.product) {
          setProduct(data.product);
          const images = data.product.images || [];
          setSelectedImage(images.length > 0 ? images[0] : (data.product.image || imgFallback));
          if (Array.isArray(data.product.sizes) && data.product.sizes.length > 0) {
            setSelectedSize(data.product.sizes[0]);
          }
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError("Unable to load product details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `₹${price.toLocaleString("en-IN")}`;
    }
    return price || "";
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (Array.isArray(product?.sizes) && product.sizes.length > 0 && !selectedSize) {
      setCartError("Please select a size first");
      return;
    }
    try {
      setAddingToCart(true);
      setCartError("");
      const res = await addToCart(product._id, quantity, selectedSize);
      if (res?.success) {
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2500);
      } else {
        setCartError(res?.message || "Could not add to cart");
        setTimeout(() => setCartError(""), 3500);
      }
    } catch (err) {
      console.error("Add to cart error:", err);
      setCartError("Failed to add to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    const res = await toggleWishlist(id, product);
    if (res?.requireLogin) {
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <main className="product-details-page">
        <div className="details-container skeleton-details-container">
          <div className="details-gallery skeleton-box" style={{ minHeight: "540px" }} />
          <div className="details-info">
            <div className="skeleton-line" style={{ width: "30%", height: "14px", marginBottom: "16px" }} />
            <div className="skeleton-line" style={{ width: "80%", height: "36px", marginBottom: "20px" }} />
            <div className="skeleton-line" style={{ width: "40%", height: "24px", marginBottom: "30px" }} />
            <div className="skeleton-line" style={{ width: "100%", height: "80px", marginBottom: "30px" }} />
            <div className="skeleton-line" style={{ width: "60%", height: "45px", marginBottom: "20px" }} />
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="product-details-page">
        <div className="details-error-box">
          <h2>Product Not Found</h2>
          <p>{error || "The requested piece is currently unavailable."}</p>
          <Link to="/products" className="error-back-btn">
            Back to Collection
          </Link>
        </div>
      </main>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image || imgFallback];

  const inStock = product.stock > 0;

  return (
    <main className="product-details-page">
      {/* Breadcrumb Navigation */}
      <div className="details-breadcrumb">
        <Link to="/products" className="back-link">
          <ArrowLeft size={16} /> Back to Collection
        </Link>
        <span className="breadcrumb-separator">/</span>
        <span>{product.category || "Collection"}</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{product.name}</span>
      </div>

      <div className="details-container">
        {/* Gallery */}
        <div className="details-gallery">
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="gallery-thumbnails">
              {images.map((img, idx) => (
                <button
                  key={`thumb-${idx}`}
                  type="button"
                  className={`thumb-btn ${selectedImage === img ? "active" : ""}`}
                  onClick={() => setSelectedImage(img)}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}

          {/* Main Hero Image */}
          <div className="gallery-main-image">
            <img src={selectedImage} alt={product.name} />
          </div>
        </div>

        {/* Product Info */}
        <div className="details-info">
          {/* Brand & Subcategory */}
          <div className="info-meta">
            <span className="brand-badge">{product.brand || "SEEMZ"}</span>
            {product.subCategory && (
              <span className="subcategory-badge">• {product.subCategory}</span>
            )}
          </div>

          {/* Name */}
          <h1 className="product-title">{product.name}</h1>

          {/* Price */}
          <div className="product-price-box">
            <span className="price-val">{formatPrice(product.price)}</span>
            <span className="tax-inclusive">Inclusive of all taxes</span>
          </div>

          {/* Description */}
          <p className="product-desc">{product.description}</p>

          {/* Size Selector */}
          {Array.isArray(product.sizes) && product.sizes.length > 0 && (
            <div className="size-selector-section">
              <div className="size-header">
                <span>Select Size</span>
                <button type="button" className="size-guide-btn">
                  Size Guide
                </button>
              </div>
              <div className="size-options">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`size-btn ${selectedSize === sz ? "active" : ""}`}
                    onClick={() => setSelectedSize(sz)}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock and Quantity */}
          <div className="stock-qty-row">
            <div className="stock-status">
              <span className={`stock-dot ${inStock ? "in-stock" : "out-of-stock"}`} />
              <span>{inStock ? `In Stock (${product.stock} available)` : "Sold Out"}</span>
            </div>

            {inStock && (
              <div className="qty-picker">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Cart Error Message */}
          {cartError && (
            <div className="product-cart-error" style={{ color: "#ef4444", fontSize: "13px", marginTop: "10px", letterSpacing: "0.5px" }}>
              {cartError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="details-actions">
            <button
              type="button"
              className={`add-cart-btn ${addedToCart ? "added" : ""}`}
              onClick={handleAddToCart}
              disabled={!inStock || addingToCart}
            >
              {addedToCart ? (
                <>
                  <Check size={18} /> Added to Bag
                </>
              ) : inStock ? (
                <>
                  <ShoppingBag size={18} /> {addingToCart ? "Adding..." : "Add to Bag"}
                </>
              ) : (
                "Sold Out"
              )}
            </button>

            <button
              type="button"
              className={`wishlist-action-btn ${isWishlisted ? "active" : ""}`}
              onClick={handleWishlistToggle}
              aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart size={20} fill={isWishlisted ? "#ffffff" : "none"} />
            </button>
          </div>

          {/* Luxury Perks */}
          <div className="luxury-perks">
            <div className="perk-item">
              <Truck size={18} />
              <div>
                <h4>Complimentary Express Shipping</h4>
                <p>On orders above ₹2,999</p>
              </div>
            </div>

            <div className="perk-item">
              <RotateCcw size={18} />
              <div>
                <h4>14-Day Returns & Exchanges</h4>
                <p>Hassle-free pickups available</p>
              </div>
            </div>

            <div className="perk-item">
              <ShieldCheck size={18} />
              <div>
                <h4>Guaranteed Authenticity</h4>
                <p>Crafted with certified premium materials</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ProductDetails;