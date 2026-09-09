import "./Home.css";
import { useState, useEffect } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { ArrowRight, ShoppingBag, Sparkles, Layers, ArrowUpRight } from "lucide-react";
import PrimaryButton from "../../components/PrimaryButton/PrimaryButton";
import ProductCard from "../../components/ProductCard/ProductCard";
import { getAllProducts } from "../../services/productservices";
import useCinematicScroll from "../../hooks/useCinematicScroll";

import heroVideo from "../../assets/videos/Home2.mp4";
import MenVideo from "../../assets/videos/Men.mp4";
import WomenVideo from "../../assets/videos/Women.mp4";
import Acc from "../../assets/videos/Acc.mp4";
import Trendy from "../../assets/images/Autumn collection.jpg";
import imgFallback from "../../assets/images/product1.jpg";
import studioPreviewImg from "../../assets/intro/complete.jpg";

const categories = [
  {
    title: "Men",
    video: MenVideo,
    link: "/men",
  },
  {
    title: "Women",
    video: WomenVideo,
    link: "/women",
  },
  {
    title: "New Arrivals",
    video: Acc,
    link: "/new",
  },
];

function Home() {
  const navigate = useNavigate();
  const { onStartBodyScan } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cinematic scroll hooks for key camera stages
  const heroScroll = useCinematicScroll({ dampening: 0.15 });
  const editorialScroll = useCinematicScroll({ dampening: 0.12 });
  const brandStoryScroll = useCinematicScroll({ dampening: 0.12 });
  const studioPortalScroll = useCinematicScroll({ dampening: 0.12 });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getAllProducts();
        if (data?.success && Array.isArray(data?.products)) {
          setProducts(data.products);
        } else if (Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to load products for Home:", err);
        setError("Unable to load latest collection.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `₹${price.toLocaleString("en-IN")}`;
    }
    return price || "";
  };

  const getProductImage = (product) => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    return product.image || imgFallback;
  };

  const renderProductCards = () => {
    if (loading) {
      return [1, 2, 3, 4].map((n) => (
        <div
          key={`skeleton-home-${n}`}
          className="product-card"
          style={{ opacity: 0.4, minHeight: "380px" }}
        >
          <div
            className="product-image"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              height: "320px",
            }}
          />
          <div className="product-details" style={{ padding: "16px 0" }}>
            <p className="product-category" style={{ color: "#555" }}>
              Loading...
            </p>
          </div>
        </div>
      ));
    }

    if (!products || products.length === 0) {
      return (
        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "50px 0", color: "#888" }}>
          <p style={{ fontSize: "16px", letterSpacing: "1px" }}>No products available in collection yet.</p>
        </div>
      );
    }

    return products.slice(0, 4).map((product, idx) => {
      const productId = product._id || product.id;
      return (
        <ProductCard
          key={`home-${productId}`}
          id={productId}
          product={product}
          image={getProductImage(product)}
          title={product.name || product.title}
          category={product.category || "Collection"}
          subCategory={product.subCategory || ""}
          price={formatPrice(product.price)}
          sizes={product.sizes}
          images={product.images}
          stock={product.stock}
        />
      );
    });
  };

  return (
    <main className="home">

      {/* ================= HERO WITH CRISP CINEMATIC PARALLAX ================= */}
      <section ref={heroScroll.ref} className="hero">
        <video
          className="hero-video"
          src={heroVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          style={{
            transform: `scale(${1 + heroScroll.scrollProgress * 0.05}) translate3d(0, ${heroScroll.scrollProgress * 20}px, 0)`,
          }}
        />

        <div className="hero-content">
          <p className="hero-tag">
            LUXURY • MINIMAL • MODERN
          </p>

          <h1>
            Crafted
            <br />
            For
            <br />
            The Bold
          </h1>

          <p className="hero-text">
            Timeless silhouettes inspired by modern luxury.
          </p>

          <div className="hero-buttons">
            <PrimaryButton
              text="SHOP COLLECTION"
              to="/products"
            />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <span>EXPLORE</span>
        </div>
      </section>

      {/* ================= NEW ARRIVALS ================= */}
      <section className="section cinematic-reveal-wrap is-visible">
        <div className="section-heading">
          <div>
            <p>Latest Collection</p>
            <h2>New Arrivals</h2>
          </div>

          <Link to="/products" className="section-explore-link">
            View All
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="product-grid cinematic-product-grid">
          {renderProductCards()}
        </div>
      </section>

      {/* ================= EDITORIAL WITH SPLIT-SCREEN PARALLAX ================= */}
      <section ref={editorialScroll.ref} className="editorial cinematic-stage">
        <div className="editorial-left cinematic-split-image-frame">
          <img
            src={Trendy}
            alt="Editorial Collection"
            style={{
              transform: `scale(1.06) translateY(${(editorialScroll.scrollProgress - 0.5) * -35}px)`,
            }}
          />
        </div>

        <div className="editorial-right cinematic-layer">
          <p>Editorial Collection</p>

          <h2>
            Autumn
            <br />
            Essentials
          </h2>

          <span>
            Clean lines.
            Premium fabrics.
            Timeless confidence.
          </span>

          <Link to="/products">
            Explore Collection
          </Link>
        </div>
      </section>

      {/* ================= AI BODY SCANNER SECTION ================= */}
      <section className="atelier-scanner-home cinematic-reveal-wrap is-visible">
        <div className="atelier-scanner-home-content">
          <p className="atelier-eyebrow">SMART FIT TECHNOLOGY</p>
          <h2>AI Body Scanner</h2>
          <p className="atelier-desc">
            Scan your body with your device camera for instant size recommendations and accurate measurements.
          </p>
          <div className="atelier-home-btn-group">
            <button 
              type="button" 
              className="atelier-scan-home-btn"
              onClick={onStartBodyScan}
            >
              TRY BODY SCANNER
            </button>
          </div>
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="section">
        <div className="section-heading">
          <div>
            <p>Browse</p>
            <h2>Categories</h2>
          </div>
        </div>

        <div className="category-grid">
          {categories.map((item, index) => (
            <Link to={item.link} className="category-card" key={index}>
              <video
                className="category-video"
                src={item.video}
                muted
                loop
                playsInline
                preload="metadata"
                onMouseEnter={(e) => {
                  try { e.currentTarget.play(); } catch (_) {}
                }}
                onMouseLeave={(e) => {
                  try { e.currentTarget.pause(); } catch (_) {}
                }}
              />
              <div className="category-overlay">
                <h3>{item.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= CINEMATIC STUDIO PORTAL BRIDGE ================= */}
      <section ref={studioPortalScroll.ref} className="cinematic-studio-portal">
        <div className="studio-portal-content">
          <div className="studio-portal-badge">
            <span className="portal-pulse-dot" />
            <span>DIGITAL ATELIER • OUTFIT BUILDER</span>
          </div>

          <h2>
            Curate Your
            <br />
            Signature Look
          </h2>

          <p>
            Step into the SEEMZ virtual fitting studio. Seamlessly layer jackets, knitwear, trousers, and boots onto an architectural tailor stand in real time.
          </p>

          <div className="studio-portal-cta-row">
            <Link to="/studio" className="studio-portal-btn">
              ENTER STUDIO <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="studio-portal-visual">
          <Link to="/studio" className="portal-wireframe-card" aria-label="Enter Studio">
            <img src={studioPreviewImg} alt="SEEMZ Outfit Studio Look Assembly" />
            <div className="portal-floating-tag">
              <span>EXPLORE 5-PIECE ENSEMBLE</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ================= BRAND STORY WITH FOCAL LENS SCRUB ================= */}
      <section ref={brandStoryScroll.ref} className="brand-story">
        <p>SEEMZ</p>

        <h2 
          className={`cinematic-focus-text ${
            brandStoryScroll.scrollProgress > 0.15 && brandStoryScroll.scrollProgress < 0.85 
              ? "in-focus" 
              : "out-of-focus"
          }`}
        >
          Luxury isn't loud.
          <br />
          It's remembered.
        </h2>

        <span
          className={`cinematic-focus-text ${
            brandStoryScroll.scrollProgress > 0.25 && brandStoryScroll.scrollProgress < 0.9 
              ? "in-focus" 
              : "out-of-focus"
          }`}
        >
          We believe great fashion doesn't chase trends.
          It creates identity.
          Every piece is crafted for confidence,
          simplicity and timeless elegance.
        </span>
      </section>

      {/* ================= NEWSLETTER ================= */}
      <section className="newsletter">
        <h2>
          Join The Community
        </h2>

        <p>
          Subscribe for new arrivals, private drops, and style updates.
        </p>

        <form onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="Enter your email"
          />

          <button type="submit">
            Subscribe
            <ShoppingBag size={18} />
          </button>
        </form>
      </section>

    </main>
  );
}

export default Home;