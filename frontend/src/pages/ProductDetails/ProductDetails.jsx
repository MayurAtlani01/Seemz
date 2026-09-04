import "./ProductDetails.css";
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useOutletContext } from "react-router-dom";
import { 
  Heart, 
  ShoppingBag, 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  Sparkles,
  Layers,
  Scissors,
  Eye,
  Info,
  ChevronRight,
  Maximize2
} from "lucide-react";
import { getProductById } from "../../services/productservices";
import { useAuth } from "../../context/AuthContext";
import ProductColorStudio, { CURATED_COLORWAYS } from "../../components/ProductColorStudio/ProductColorStudio";
import FitVisualizer from "../../components/FitVisualizer/FitVisualizer";
import CompleteTheLook from "../../components/CompleteTheLook/CompleteTheLook";
import imgFallback from "../../assets/images/product1.jpg";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const outletCtx = useOutletContext();
  const { user, isProductWishlisted, toggleWishlist, addToCart } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedImage, setSelectedImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(CURATED_COLORWAYS[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("materials"); // "materials" | "craftsmanship" | "care"
  const [showStickyBar, setShowStickyBar] = useState(false);
  
  const [addedToCart, setAddedToCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartError, setCartError] = useState("");

  const heroActionRef = useRef(null);
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
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [id]);

  // Scroll observer for Sticky Action Bar
  useEffect(() => {
    const handleScroll = () => {
      if (heroActionRef.current) {
        const rect = heroActionRef.current.getBoundingClientRect();
        setShowStickyBar(rect.bottom < 0);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const handleOpenScanner = () => {
    if (outletCtx?.onStartBodyScan) {
      outletCtx.onStartBodyScan();
    }
  };

  if (loading) {
    return (
      <main className="product-details-page">
        <div className="details-container skeleton-details-container">
          <div className="details-gallery skeleton-box" style={{ minHeight: "580px" }} />
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

  // Sartorial Specifications derived from garment data
  const specData = {
    gsm: product.category?.toLowerCase().includes("coat") || product.name?.toLowerCase().includes("jacket")
      ? "420 GSM Heavyweight Fabric"
      : product.category?.toLowerCase().includes("pant") || product.name?.toLowerCase().includes("trouser")
      ? "340 GSM Durable Twill"
      : "280 GSM Premium Organic Cotton",
    weave: "Double-Faced Structured Weave",
    origin: "Crafted in Limited Batches",
    drape: "Tailored Fit with Clean Lines",
    care: "Dry clean or gentle hand wash in cold water. Lay flat to dry in shade."
  };

  return (
    <main className="product-details-page">
      {/* Editorial Breadcrumb Navigation */}
      <nav className="details-breadcrumb" aria-label="Breadcrumb">
        <Link to="/products" className="back-link">
          <ArrowLeft size={14} /> Back to Collection
        </Link>
        <span className="breadcrumb-separator">/</span>
        <span>{product.category || "Collection"}</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      <div className="details-container">
        {/* Gallery with Luxury Image Zoom */}
        <section className="details-gallery" aria-label="Product Gallery">
          {images.length > 1 && (
            <div className="gallery-thumbnails">
              {images.map((img, idx) => (
                <button
                  key={`thumb-${idx}`}
                  type="button"
                  className={`thumb-btn ${selectedImage === img ? "active" : ""}`}
                  onClick={() => setSelectedImage(img)}
                  aria-label={`View garment image ${idx + 1}`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}

          <div className="gallery-main-image">
            <img src={selectedImage} alt={product.name} />
            <span className="gallery-curation-tag">SEEMZ COLLECTION</span>
          </div>
        </section>

        {/* Product Info Column */}
        <section className="details-info" aria-label="Product Information">
          {/* Brand & Subcategory */}
          <div className="info-meta">
            <span className="brand-badge">{product.brand || "SEEMZ"}</span>
            {product.subCategory && (
              <span className="subcategory-badge">• {product.subCategory}</span>
            )}
            <span className="edition-badge">• EDITION 2026</span>
          </div>

          {/* Title */}
          <h1 className="product-title">{product.name}</h1>

          {/* Price */}
          <div className="product-price-box">
            <span className="price-val">{formatPrice(product.price)}</span>
            <span className="tax-inclusive">Inclusive of all taxes</span>
          </div>

          {/* Color Studio Integration */}
          <ProductColorStudio
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
          />

          {/* Description */}
          <p className="product-desc">{product.description}</p>

          {/* Size Selector with Bespoke Recommendation Badge */}
          {Array.isArray(product.sizes) && product.sizes.length > 0 && (
            <div className="size-selector-section">
              <div className="size-header">
                <span>SELECT SIZE</span>
                <button 
                  type="button" 
                  className="size-guide-btn"
                  onClick={handleOpenScanner}
                >
                  Find My Size
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

          {/* Size & Bespoke Fit Visualization (Connected to Body Scanner) */}
          <FitVisualizer
            product={product}
            selectedSize={selectedSize}
            onSelectSize={setSelectedSize}
            onOpenScanner={handleOpenScanner}
          />

          {/* Stock and Quantity */}
          <div className="stock-qty-row">
            <div className="stock-status">
              <span className={`stock-dot ${inStock ? "in-stock" : "out-of-stock"}`} />
              <span>{inStock ? `In Stock (${product.stock} available)` : "Out of Stock"}</span>
            </div>

            {inStock && (
              <div className="qty-picker">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Cart Error Message */}
          {cartError && (
            <div className="product-cart-error" role="alert">
              {cartError}
            </div>
          )}

          {/* Action Buttons (Hero Trigger Anchor) */}
          <div className="details-actions" ref={heroActionRef}>
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
                "Out of Stock"
              )}
            </button>

            <button
              type="button"
              className={`wishlist-action-btn ${isWishlisted ? "active" : ""}`}
              onClick={handleWishlistToggle}
              aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart
                size={20}
                fill={isWishlisted ? "#000000" : "none"}
                stroke={isWishlisted ? "#000000" : "#ffffff"}
              />
            </button>
          </div>

          {/* Luxury Atelier Perks */}
          <div className="luxury-perks">
            <div className="perk-item">
              <Truck size={18} strokeWidth={1.5} />
              <div>
                <h4>Free Standard Shipping</h4>
                <p>Delivered safely in signature packaging</p>
              </div>
            </div>

            <div className="perk-item">
              <RotateCcw size={18} strokeWidth={1.5} />
              <div>
                <h4>14-Day Easy Returns</h4>
                <p>Hassle-free doorstep pickup</p>
              </div>
            </div>

            <div className="perk-item">
              <ShieldCheck size={18} strokeWidth={1.5} />
              <div>
                <h4>100% Authentic Quality</h4>
                <p>Premium fabrics and verified craftsmanship</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Cinematic Specifications & Atelier Storytelling Section */}
      <section className="product-spec-story-section">
        <div className="spec-story-container">
          <div className="spec-tabs-header">
            <button
              type="button"
              className={`spec-tab-btn ${activeTab === "materials" ? "active" : ""}`}
              onClick={() => setActiveTab("materials")}
            >
              <Layers size={14} /> Materials
            </button>
            <button
              type="button"
              className={`spec-tab-btn ${activeTab === "craftsmanship" ? "active" : ""}`}
              onClick={() => setActiveTab("craftsmanship")}
            >
              <Scissors size={14} /> Craftsmanship
            </button>
            <button
              type="button"
              className={`spec-tab-btn ${activeTab === "care" ? "active" : ""}`}
              onClick={() => setActiveTab("care")}
            >
              <Info size={14} /> Care Guide
            </button>
          </div>

          <div className="spec-tab-content">
            {activeTab === "materials" && (
              <div className="spec-content-grid">
                <div className="spec-metric-card">
                  <span className="spec-kicker">FABRIC WEIGHT</span>
                  <h4>{specData.gsm}</h4>
                  <p>Substantial weight with natural breathability for all-day comfort.</p>
                </div>
                <div className="spec-metric-card">
                  <span className="spec-kicker">WEAVE</span>
                  <h4>{specData.weave}</h4>
                  <p>Woven on precision looms to keep its shape and durability over time.</p>
                </div>
                <div className="spec-metric-card">
                  <span className="spec-kicker">PRODUCTION</span>
                  <h4>{specData.origin}</h4>
                  <p>Crafted in limited batches to guarantee high quality and finishing.</p>
                </div>
              </div>
            )}

            {activeTab === "craftsmanship" && (
              <div className="spec-content-grid">
                <div className="spec-metric-card">
                  <span className="spec-kicker">SEAMS</span>
                  <h4>Reinforced Seams</h4>
                  <p>Clean finished seams create a smooth touch and long-lasting durability.</p>
                </div>
                <div className="spec-metric-card">
                  <span className="spec-kicker">FIT & SILHOUETTE</span>
                  <h4>{specData.drape}</h4>
                  <p>Designed with relaxed shoulders and a natural, flattering drape.</p>
                </div>
                <div className="spec-metric-card">
                  <span className="spec-kicker">DETAILS & HARDWARE</span>
                  <h4>Matte Metal Fasteners</h4>
                  <p>Custom metal hardware with a durable anti-corrosion matte finish.</p>
                </div>
              </div>
            )}

            {activeTab === "care" && (
              <div className="spec-care-box">
                <span className="spec-kicker">CARE INSTRUCTIONS</span>
                <h4>{specData.care}</h4>
                <p>Hang in a cool, dry place. Avoid prolonged direct sunlight to preserve color depth.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Complete The Look Curated Ensemble */}
      <div className="product-details-ctl-wrap">
        <CompleteTheLook currentProduct={product} />
      </div>

      {/* Sticky Bottom Purchase Bar */}
      <aside className={`sticky-purchase-bar ${showStickyBar ? "visible" : ""}`} aria-label="Quick Purchase Bar">
        <div className="sticky-bar-container">
          <div className="sticky-bar-product">
            <div className="sticky-thumb">
              <img src={selectedImage} alt={product.name} />
            </div>
            <div className="sticky-text">
              <span className="sticky-brand">{product.brand || "SEEMZ"}</span>
              <h4 className="sticky-title">{product.name}</h4>
            </div>
          </div>

          <div className="sticky-bar-actions">
            <div className="sticky-price-group">
              <span className="sticky-price">{formatPrice(product.price)}</span>
              {selectedSize && (
                <span className="sticky-size-pill">SIZE: {selectedSize}</span>
              )}
            </div>

            <button
              type="button"
              className={`sticky-add-btn ${addedToCart ? "added" : ""}`}
              onClick={handleAddToCart}
              disabled={!inStock || addingToCart}
            >
              {addedToCart ? (
                <>
                  <Check size={16} /> Added to Bag
                </>
              ) : inStock ? (
                <>
                  <ShoppingBag size={16} /> {addingToCart ? "Adding..." : "Add to Bag"}
                </>
              ) : (
                "Out of Stock"
              )}
            </button>
          </div>
        </div>
      </aside>
    </main>
  );
}

export default ProductDetails;