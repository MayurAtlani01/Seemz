import "./Men.css";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import PrimaryButton from "../../components/PrimaryButton/PrimaryButton";
import ProductCard from "../../components/ProductCard/ProductCard";
import { getAllProducts } from "../../services/productservices";

import menHero from "../../assets/videos/Men.mp4";
import editorialImg from "../../assets/images/editorialImg.jpg";
import featuredImg from "../../assets/images/featuredImg.jpg";
import imgFallback from "../../assets/images/product1.jpg";

function Men() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMenProducts = async () => {
      try {
        setLoading(true);
        const data = await getAllProducts();
        if (data?.success && Array.isArray(data?.products)) {
          const menItems = data.products.filter(
            (p) =>
              !p.category ||
              p.category.toLowerCase() === "men" ||
              p.category.toLowerCase() === "man" ||
              p.category.toLowerCase() === "mens"
          );
          setProducts(menItems.length > 0 ? menItems : data.products);
        } else if (Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products for Men page:", err);
        setError("Unable to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenProducts();
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

  const renderProductCards = (items, prefix = "prod") => {
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
          category={product.subCategory || product.category || "Men"}
          price={formatPrice(product.price)}
        />
      );
    });
  };

  return (
    <main className="men-page">
      {/* ================= HERO ================= */}
      <section className="men-hero">
        <video
          className="men-hero-video"
          src={menHero}
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="men-hero-overlay"></div>

        <div className="men-hero-content">
          <span className="men-hero-tag">MEN COLLECTION 2026</span>

          <h1>
            Crafted For
            <br />
            Modern Men
          </h1>

          <p>
            Minimal silhouettes.
            Premium fabrics.
            Timeless luxury.
          </p>

          <div className="men-hero-buttons">
            <PrimaryButton text="Shop Now" to="/products" />

            <a
              href="#men-collection"
              className="men-hero-link hero-link"
              onClick={(e) => {
                e.preventDefault();
                const section = document.getElementById("men-collection");
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
      <section className="section" id="men-collection">
        <div className="section-heading">
          <div>
            <span>NEW SEASON</span>
            <h2>New Arrivals</h2>
          </div>

          <Link to="/products">View All →</Link>
        </div>

        <div className="product-grid">
          {renderProductCards(products.slice(0, 8), "new")}
        </div>
      </section>

      {/* ================= EDITORIAL ================= */}
      <section className="men-editorial">
        <div className="editorial-image">
          <img src={editorialImg} alt="Editorial" />
        </div>

        <div className="editorial-content">
          <span>EDITORIAL</span>

          <h2>
            Designed To
            <br />
            Stand Apart
          </h2>

          <p>
            Contemporary tailoring meets timeless aesthetics.
            Every piece is crafted for men who appreciate
            understated luxury and refined simplicity.
          </p>

          <PrimaryButton text="Explore Collection" to="/products" />
        </div>
      </section>

      {/* ================= TRENDING NOW ================= */}
      <section className="section">
        <div className="section-heading">
          <div>
            <span>TRENDING</span>
            <h2>Trending Now</h2>
          </div>

          <Link to="/products">View All →</Link>
        </div>

        <div className="product-grid">
          {renderProductCards([...products].reverse().slice(0, 8), "trend")}
        </div>
      </section>

      {/* ================= FEATURED ================= */}
      <section className="featured-look">
        <img src={featuredImg} alt="Featured Collection" />

        <div className="featured-overlay">
          <span>FEATURED COLLECTION</span>

          <h2>
            Autumn
            <br />
            Essentials
          </h2>

          <p>
            Elevated everyday wear designed with premium
            fabrics and clean silhouettes.
          </p>

          <PrimaryButton text="Shop The Look" to="/products" />
        </div>
      </section>

      {/* ================= BEST SELLERS ================= */}
      <section className="section">
        <div className="section-heading">
          <div>
            <span>BEST SELLERS</span>
            <h2>Customer Favorites</h2>
          </div>

          <Link to="/products">View All →</Link>
        </div>

        <div className="product-grid">
          {renderProductCards(products.slice(0, 8), "best")}
        </div>
      </section>
    </main>
  );
}

export default Men;