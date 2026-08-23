import "./Wishlist.css";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { addToCart } from "../../services/cartservices";
import imgFallback from "../../assets/images/product1.jpg";

function Wishlist() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    wishlistItems,
    wishlistLoading,
    fetchWishlist,
    toggleWishlist,
  } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, fetchWishlist]);

  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `₹${price.toLocaleString("en-IN")}`;
    }
    return price || "";
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product._id || product.id, 1, product.sizes?.[0] || "");
      alert("Added to bag!");
    } catch (err) {
      console.error("Cart error:", err);
    }
  };

  const handleRemove = async (productId) => {
    await toggleWishlist(productId);
  };

  // 1. Not Authenticated State
  if (!isAuthenticated) {
    return (
      <main className="wishlist-page">
        <div className="wishlist-auth-box">
          <div className="wishlist-auth-icon">
            <Heart size={36} strokeWidth={1.2} />
          </div>
          <span className="wishlist-eyebrow">SEEMZ ATELIER</span>
          <h1>Your Personal Wishlist</h1>
          <p>
            Sign in to save your favorite luxury silhouettes, receive availability
            alerts, and access your curated wishlist across all devices.
          </p>
          <div className="wishlist-auth-actions">
            <Link to="/login" className="wishlist-btn-primary">
              Sign In to Account
            </Link>
            <Link to="/register" className="wishlist-btn-secondary">
              Create New Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 2. Loading State
  if (wishlistLoading && wishlistItems.length === 0) {
    return (
      <main className="wishlist-page">
        <header className="wishlist-header">
          <span className="wishlist-eyebrow">SAVED PIECES</span>
          <h1>My Wishlist</h1>
        </header>
        <div className="wishlist-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={`skel-wish-${n}`} className="wishlist-card skeleton-card">
              <div className="skeleton-image" style={{ aspectRatio: "3/4", background: "#151515" }} />
              <div className="skeleton-body" style={{ padding: "16px" }}>
                <div className="skeleton-line" style={{ height: "12px", background: "rgba(255,255,255,0.1)", marginBottom: "8px" }} />
                <div className="skeleton-line" style={{ height: "18px", width: "70%", background: "rgba(255,255,255,0.1)" }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  // 3. Authenticated - Empty Wishlist
  if (wishlistItems.length === 0) {
    return (
      <main className="wishlist-page">
        <div className="wishlist-empty-box">
          <div className="wishlist-empty-icon">
            <Heart size={42} strokeWidth={1} />
          </div>
          <span className="wishlist-eyebrow">YOUR COLLECTION IS EMPTY</span>
          <h1>No Saved Pieces Yet</h1>
          <p>
            Explore our curated collections of contemporary luxury menswear,
            womenswear, and seasonal arrivals to create your personal wardrobe.
          </p>
          <Link to="/products" className="wishlist-btn-primary">
            Explore The Collection <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  // 4. Authenticated - Populated Wishlist
  return (
    <main className="wishlist-page">
      <header className="wishlist-header">
        <span className="wishlist-eyebrow">CURATED SELECTION</span>
        <h1>My Wishlist</h1>
        <p className="wishlist-count">
          {wishlistItems.length} {wishlistItems.length === 1 ? "Saved Piece" : "Saved Pieces"}
        </p>
      </header>

      <div className="wishlist-grid">
        {wishlistItems.map((product) => {
          const prodId = product._id || product.id;
          const img =
            Array.isArray(product.images) && product.images.length > 0
              ? product.images[0]
              : product.image || imgFallback;

          return (
            <div key={prodId} className="wishlist-card">
              <div className="wishlist-image-wrap">
                <Link to={`/products/${prodId}`}>
                  <img src={img} alt={product.name} />
                </Link>
                <button
                  type="button"
                  className="wishlist-delete-btn"
                  onClick={() => handleRemove(prodId)}
                  title="Remove from wishlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="wishlist-card-details">
                <span className="wishlist-card-category">
                  {product.subCategory || product.category || "SEEMZ"}
                </span>

                <Link to={`/products/${prodId}`} className="wishlist-card-title">
                  {product.name}
                </Link>

                <span className="wishlist-card-price">
                  {formatPrice(product.price)}
                </span>

                <div className="wishlist-card-actions">
                  <button
                    type="button"
                    className="wishlist-add-bag-btn"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingBag size={15} /> Add to Bag
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default Wishlist;