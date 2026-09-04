import "./Women.css";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import PrimaryButton from "../../components/PrimaryButton/PrimaryButton";
import ProductCard from "../../components/ProductCard/ProductCard";
import { getAllProducts } from "../../services/productservices";

import womenHero from "../../assets/videos/Women.mp4";
import editorialImg from "../../assets/images/women/womenEditorial.jpg";
import featuredImg from "../../assets/images/women/womenFeatured2.jpg";
import imgFallback from "../../assets/images/women/women1.jpg";

function Women() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWomenProducts = async () => {
      try {
        setLoading(true);
        const data = await getAllProducts();
        if (data?.success && Array.isArray(data?.products)) {
          const womenItems = data.products.filter(
            (p) =>
              !p.category ||
              p.category.toLowerCase() === "women" ||
              p.category.toLowerCase() === "woman" ||
              p.category.toLowerCase() === "womens"
          );
          setProducts(womenItems.length > 0 ? womenItems : data.products);
        } else if (Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products for Women page:", err);
        setError("Unable to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchWomenProducts();
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

  const renderProductCards = (items, prefix = "women-prod") => {
    if (loading) {
      return [1, 2, 3, 4].map((n) => (
        <div
          key={`skeleton-${prefix}-${n}`}
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

    if (!items || items.length === 0) {
      return (
        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 0", color: "#888" }}>
          <p>No products available at the moment.</p>
        </div>
      );
    }

    return items.map((product) => {
      const productId = product._id || product.id;
      return (
        <ProductCard
          key={`${prefix}-${productId}`}
          id={productId}
          image={getProductImage(product)}
          title={product.name || product.title}
          category={product.subCategory || product.category || "Women"}
          price={formatPrice(product.price)}
        />
      );
    });
  };

  return (
    <main className="women-page">
      {/* ================= HERO ================= */}
      <section className="women-hero">
        <video
          className="women-hero-video"
          src={womenHero}
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="women-hero-overlay"></div>

        <div className="women-hero-content">
          <span className="women-hero-tag">WOMEN COLLECTION 2026</span>

          <h1>
            Elegance
            <br />
            In Motion
          </h1>

          <p>
            Timeless silhouettes.
            Modern femininity.
            Effortless luxury.
          </p>

          <div className="women-hero-buttons">
            <PrimaryButton text="Shop Now" to="/products" />

            <a
              href="#women-collection"
              className="women-hero-link"
              onClick={(e) => {
                e.preventDefault();
                const section = document.getElementById("women-collection");
                if (section) {
                  section.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Discover More <span className="arrow">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ================= NEW ARRIVALS ================= */}
      <section className="women-section" id="women-collection">
        <div className="women-section-heading">
          <div>
            <span>NEW SEASON</span>
            <h2>New Arrivals</h2>
          </div>

          <Link to="/products">View All →</Link>
        </div>

        <div className="women-product-grid">
          {renderProductCards(products.slice(0, 8), "new")}
        </div>
      </section>

      {/* ================= EDITORIAL ================= */}
      <section className="women-editorial">
        <div className="women-editorial-image">
          <img src={editorialImg} alt="Editorial" />
        </div>

        <div className="women-editorial-content">
          <span>EDITORIAL</span>

          <h2>
            Crafted For
            <br />
            Confident Women
          </h2>

          <p>
            Elegant tailoring meets contemporary design.
            Every collection is created for women who embrace
            confidence, individuality and timeless style.
          </p>

          <PrimaryButton text="Explore Collection" to="/products" />
        </div>
      </section>

      {/* ================= TRENDING NOW ================= */}
      <section className="women-section">
        <div className="women-section-heading">
          <div>
            <span>TRENDING</span>
            <h2>Trending Now</h2>
          </div>

          <Link to="/products">View All →</Link>
        </div>

        <div className="women-product-grid">
          {renderProductCards([...products].reverse().slice(0, 8), "trend")}
        </div>
      </section>

      {/* ================= FEATURED ================= */}
      <section className="women-featured">
        <img src={featuredImg} alt="Featured Collection" />

        <div className="women-featured-overlay">
          <span>FEATURED COLLECTION</span>

          <h2>
            The
            <br />
            Signature
            <br />
            Collection
          </h2>

          <p>
            Luxury essentials designed to elevate
            every wardrobe with effortless elegance.
          </p>

          <PrimaryButton text="Shop The Look" to="/products" />
        </div>
      </section>

      {/* ================= EDITOR'S PICKS ================= */}
      <section className="women-section">
        <div className="women-section-heading">
          <div>
            <span>EDITOR'S PICKS</span>
            <h2>Our Favorites</h2>
          </div>

          <Link to="/products">View All →</Link>
        </div>

        <div className="women-product-grid">
          {renderProductCards(products.slice(0, 8), "editor")}
        </div>
      </section>
    </main>
  );
}

export default Women;