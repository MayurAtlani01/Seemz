import "./Home.css";
import { useState, useEffect } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";
import PrimaryButton from "../../components/PrimaryButton/PrimaryButton";
import ProductCard from "../../components/ProductCard/ProductCard";
import { getAllProducts } from "../../services/productservices";

import heroVideo from "../../assets/videos/Home2.mp4";
import MenVideo from "../../assets/videos/Men.mp4";
import WomenVideo from "../../assets/videos/Women.mp4";
import Acc from "../../assets/videos/Acc.mp4";
import Trendy from "../../assets/images/Autumn collection.jpg";
import imgFallback from "../../assets/images/product1.jpg";

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

    return products.slice(0, 4).map((product) => {
      const productId = product._id || product.id;
      return (
        <ProductCard
          key={`home-${productId}`}
          id={productId}
          image={getProductImage(product)}
          title={product.name || product.title}
          category={product.subCategory || product.category || "Collection"}
          price={formatPrice(product.price)}
        />
      );
    });
  };

  return (
    <main className="home">

      {/* ================= HERO ================= */}
      <section className="hero">
        <video
          className="hero-video"
          src={heroVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
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
      </section>

      {/* ================= NEW ARRIVALS ================= */}
      <section className="section">
        <div className="section-heading">
          <div>
            <p>Latest Collection</p>
            <h2>New Arrivals</h2>
          </div>

          <Link to="/products">
            View All
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="product-grid">
          {renderProductCards()}
        </div>
      </section>

      {/* ================= EDITORIAL ================= */}

      <section className="editorial">

        <div className="editorial-left">

          <img
            src={Trendy}
            alt="Editorial Collection"
          />

        </div>

        <div className="editorial-right">

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
      <section className="atelier-scanner-home">
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



      {/* ================= BRAND STORY ================= */}

      <section className="brand-story">

        <p>SEEMZ</p>

        <h2>
          Luxury isn't loud.
          <br />
          It's remembered.
        </h2>

        <span>
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

        <form>

          <input
            type="email"
            placeholder="Enter your email"
          />

          <button>

            Subscribe

            <ShoppingBag size={18} />

          </button>

        </form>

      </section>

    </main>
  );
}

export default Home;