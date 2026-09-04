import "./NewArrivals.css";
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

import PrimaryButton from "../../components/PrimaryButton/PrimaryButton";
import ProductCard from "../../components/ProductCard/ProductCard";
import { getAllProducts } from "../../services/productservices";

import hero from "../../assets/images/new-arrivals/hero.jpg";
import editorial from "../../assets/images/new-arrivals/editorial.jpg";
import imgFallback from "../../assets/images/new-arrivals/new1.jpg";

function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setLoading(true);
        const data = await getAllProducts();
        if (data?.success && Array.isArray(data?.products)) {
          setProducts(data.products);
        } else if (Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products for New Arrivals page:", err);
        setError("Unable to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchNewArrivals();
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

  const filteredAndSortedProducts = useMemo(() => {
    let list = [...products];

    // Filter
    if (activeFilter === "Men") {
      list = list.filter(
        (p) =>
          p.category &&
          (p.category.toLowerCase() === "men" ||
            p.category.toLowerCase() === "man" ||
            p.category.toLowerCase() === "mens")
      );
    } else if (activeFilter === "Women") {
      list = list.filter(
        (p) =>
          p.category &&
          (p.category.toLowerCase() === "women" ||
            p.category.toLowerCase() === "woman" ||
            p.category.toLowerCase() === "womens")
      );
    } else if (activeFilter === "Trending") {
      list = [...list].reverse();
    } else if (activeFilter === "Editor's Picks") {
      list = list.filter((_, idx) => idx % 2 === 0);
    }

    // Sort
    if (sortBy === "Price Low-High") {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "Price High-Low") {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === "Newest") {
      list.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
      });
    }

    return list;
  }, [products, activeFilter, sortBy]);

  const renderProductCards = (items, prefix = "new-prod") => {
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
        <div
          style={{
            gridColumn: "1 / -1",
            textAlign: "center",
            padding: "40px 0",
            color: "#888",
          }}
        >
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
          category={product.subCategory || product.category || "New Arrival"}
          price={formatPrice(product.price)}
        />
      );
    });
  };

  const filterOptions = ["All", "Men", "Women", "Trending", "Editor's Picks"];

  const firstGridProducts = filteredAndSortedProducts.slice(0, 8);
  const secondGridProducts =
    filteredAndSortedProducts.length > 8
      ? filteredAndSortedProducts.slice(8, 16)
      : [...filteredAndSortedProducts].reverse().slice(0, 8);

  return (
    <main className="new-page">
      {/* HERO */}
      <section className="new-hero">
        <img src={hero} alt="New Arrivals" />
        <div className="new-overlay"></div>
        <div className="new-hero-content">
          <span className="new-hero-tag">NEW ARRIVALS 2026</span>
          <h1>
            The Latest
            <br />
            Collection
          </h1>
          <p>
            Discover timeless silhouettes crafted for the modern wardrobe.
          </p>
          <div className="new-hero-buttons">
            <PrimaryButton text="Explore Collection" to="/products" />
            <a
              href="#new-arrivals-collection"
              className="new-hero-link"
              onClick={(e) => {
                e.preventDefault();
                const section = document.getElementById("new-arrivals-collection");
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

      {/* HEADING */}
      <section className="new-heading" id="new-arrivals-collection">
        <h2>New Arrivals</h2>
        <p>
          Curated pieces inspired by modern luxury and effortless elegance.
        </p>
      </section>

      {/* FILTER */}
      <section className="new-filter">
        <div className="new-filter-buttons">
          {filterOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={activeFilter === option ? "active" : ""}
              onClick={() => setActiveFilter(option)}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="new-filter-sort">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort products"
          >
            <option value="Newest">Newest</option>
            <option value="Price Low-High">Price Low-High</option>
            <option value="Price High-Low">Price High-Low</option>
          </select>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="new-grid">
        {renderProductCards(firstGridProducts, "new-main")}
      </section>

      {/* EDITORIAL */}
      <section className="new-editorial">
        <img src={editorial} alt="Editorial" />
        <div className="new-editorial-overlay">
          <span>EDITORIAL</span>
          <h2>
            Designed
            <br />
            Without
            <br />
            Compromise
          </h2>
          <p>
            Every garment is thoughtfully crafted to deliver timeless style and
            exceptional quality for the modern wardrobe.
          </p>
          <PrimaryButton text="Explore Collection" to="/products" />
        </div>
      </section>

      {/* MORE PRODUCTS */}
      {(loading || filteredAndSortedProducts.length > 0) && (
        <section className="new-grid">
          {renderProductCards(secondGridProducts, "new-more")}
        </section>
      )}
    </main>
  );
}

export default NewArrivals;