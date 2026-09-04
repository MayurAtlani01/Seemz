import "./Wishlist.css";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, Trash2, ArrowRight, Check, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
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
    addToCart,
  } = useAuth();

  const [addingId, setAddingId] = useState(null);
  const [addedMap, setAddedMap] = useState({});
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && typeof fetchWishlist === "function") {
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
    if (!product) return;
    const prodId = product._id || product.id;
    try {
      setAddingId(prodId);
      const res = await addToCart(prodId, 1, Array.isArray(product.sizes) && product.sizes[0] ? product.sizes[0] : "M");
      if (res?.success) {
        setAddedMap((prev) => ({ ...prev, [prodId]: true }));
        setTimeout(() => {
          setAddedMap((prev) => ({ ...prev, [prodId]: false }));
        }, 2000);
      }
    } catch (err) {
      console.error("Cart error:", err);
    } finally {
      setAddingId(null);
    }
  };

  const handleRemove = async (productId) => {
    if (!productId) return;
    try {
      await toggleWishlist(productId);
    } catch (err) {
      console.error("Wishlist remove error:", err);
    }
  };

  // Safely extract valid product objects (ignoring nulls, undefined, or string IDs)
  const validItems = Array.isArray(wishlistItems)
    ? wishlistItems.filter((p) => p && typeof p === "object" && (p._id || p.id))
    : [];

  // 1. Not Authenticated State
  if (!isAuthenticated) {
    return (
      <main className="wishlist-page">
        <div className="wishlist-auth-box">
          <div className="wishlist-auth-icon">
            <Heart size={36} strokeWidth={1.2} />
          </div>
          <span className="wishlist-eyebrow">SEEMZ</span>
          <h1>Your Wishlist</h1>
          <p>
            Sign in to save your favorite items and access your wishlist on any device.
          </p>
          <div className="wishlist-auth-actions">
            <Link to="/login" className="wishlist-btn-primary">
              Sign In
            </Link>
            <Link to="/register" className="wishlist-btn-secondary">
              Create Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 2. Loading State
  if (wishlistLoading && validItems.length === 0) {
    return (
      <main className="wishlist-page">
        <header className="wishlist-header">
          <span className="wishlist-eyebrow">SAVED ITEMS</span>
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
  if (validItems.length === 0) {
    return (
      <main className="wishlist-page">
        <div className="wishlist-empty-box">
          <div className="wishlist-empty-icon">
            <Heart size={42} strokeWidth={1} />
          </div>
          <span className="wishlist-eyebrow">YOUR WISHLIST IS EMPTY</span>
          <h1>No Saved Items Yet</h1>
          <p>
            Explore our collections and save your favorite pieces here.
          </p>
          <Link to="/products" className="wishlist-btn-primary">
            Start Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  // 4. Authenticated - Populated Wishlist
  return (
    <main className="wishlist-page">
      <header className="wishlist-header">
        <span className="wishlist-eyebrow">SAVED ITEMS</span>
        <h1>My Wishlist</h1>
        <p className="wishlist-count">
          {validItems.length} {validItems.length === 1 ? "Saved Item" : "Saved Items"}
        </p>
      </header>

      <div className="wishlist-grid">
        {validItems.map((product, idx) => {
          const prodId = product._id || product.id || String(idx);
          const name = product.name || "SEEMZ Atelier Piece";
          const category = product.subCategory || product.category || "SEEMZ";
          const price = formatPrice(product.price);
          const img =
            Array.isArray(product.images) && product.images.length > 0
              ? product.images[0]
              : product.image || imgFallback;

          return (
            <div key={prodId} className="wishlist-card">
              <div className="wishlist-image-wrap">
                <Link to={`/products/${prodId}`}>
                  <img src={img} alt={name} />
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
                  {category}
                </span>

                <Link to={`/products/${prodId}`} className="wishlist-card-title">
                  {name}
                </Link>

                <span className="wishlist-card-price">
                  {price}
                </span>

                <div className="wishlist-card-actions">
                  <button
                    type="button"
                    className={`wishlist-add-bag-btn ${addedMap[prodId] ? "added" : ""}`}
                    onClick={() => handleAddToCart(product)}
                    disabled={addingId === prodId}
                  >
                    {addedMap[prodId] ? (
                      <>
                        <Check size={14} /> Added
                      </>
                    ) : addingId === prodId ? (
                      <>
                        <ShoppingBag size={14} /> Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={14} /> Add to Bag
                      </>
                    )}
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