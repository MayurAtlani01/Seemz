import "./Products.css";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import ProductCard from "../../components/ProductCard/ProductCard";
import { getAllProducts } from "../../services/productservices";
import imgFallback from "../../assets/images/product1.jpg";

const CATEGORIES = ["All", "Men", "Women", "New Arrivals"];

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeSubCategory, setActiveSubCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  // Sync URL search params
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && CATEGORIES.includes(cat)) {
      setActiveCategory(cat);
    }
  }, [searchParams]);

  // Fetch all products from MongoDB
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllProducts();
        if (data?.success && Array.isArray(data?.products)) {
          setProducts(data.products);
        } else if (Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Unable to load collection. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Compute available subcategories dynamically from loaded products
  const availableSubCategories = useMemo(() => {
    const subs = new Set();
    products.forEach((p) => {
      if (
        activeCategory === "All" ||
        (activeCategory === "New Arrivals") ||
        p.category?.toLowerCase() === activeCategory.toLowerCase()
      ) {
        if (p.subCategory) subs.add(p.subCategory);
      }
    });
    return ["All", ...Array.from(subs)];
  }, [products, activeCategory]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (activeCategory === "Men") {
      list = list.filter(
        (p) =>
          p.category?.toLowerCase() === "men" ||
          p.category?.toLowerCase() === "man" ||
          p.category?.toLowerCase() === "mens"
      );
    } else if (activeCategory === "Women") {
      list = list.filter(
        (p) =>
          p.category?.toLowerCase() === "women" ||
          p.category?.toLowerCase() === "woman" ||
          p.category?.toLowerCase() === "womens"
      );
    } else if (activeCategory === "New Arrivals") {
      // Sort newest or recent 30 days
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    // Subcategory filter
    if (activeSubCategory !== "All") {
      list = list.filter(
        (p) => p.subCategory?.toLowerCase() === activeSubCategory.toLowerCase()
      );
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.subCategory?.toLowerCase().includes(q)
      );
    }

    // Sort order
    if (sortBy === "price-low") {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-high") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "newest" && activeCategory !== "New Arrivals") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [products, activeCategory, activeSubCategory, searchQuery, sortBy]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setActiveSubCategory("All");
    if (cat === "All") {
      searchParams.delete("category");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: cat });
    }
  };

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

  return (
    <main className="products-page">
      {/* Header */}
      <header className="products-header">
        <p className="products-tag">SEEMZ ATELIER</p>
        <h1>The Full Collection</h1>
        <p className="products-subtitle">
          Timeless silhouettes, meticulous tailoring, and understated luxury.
        </p>
      </header>

      {/* Filter and Control Bar */}
      <div className="products-filter-bar">
        {/* Main Category Tabs */}
        <div className="category-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-tab-btn ${activeCategory === cat ? "active" : ""}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort & Count */}
        <div className="products-meta-controls">
          <span className="product-count-label">
            {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"}
          </span>

          <div className="sort-wrapper">
            <ArrowUpDown size={14} className="sort-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
              aria-label="Sort products"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subcategory Pills */}
      {availableSubCategories.length > 2 && (
        <div className="subcategory-pills">
          {availableSubCategories.map((sub) => (
            <button
              key={sub}
              className={`sub-pill ${activeSubCategory === sub ? "active" : ""}`}
              onClick={() => setActiveSubCategory(sub)}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Product Grid Area */}
      <section className="products-grid-section">
        {/* Loading Skeletons */}
        {loading && (
          <div className="products-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={`skel-${n}`} className="product-card skeleton-card">
                <div className="product-image skeleton-image" />
                <div className="product-details skeleton-details">
                  <div className="skeleton-line short" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line short" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="products-state-box">
            <p className="state-title">{error}</p>
            <button className="state-btn" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="products-state-box">
            <p className="state-title">No products found in this category.</p>
            <p className="state-desc">
              Try adjusting your selected filters or explore our other collections.
            </p>
            <button
              className="state-btn"
              onClick={() => {
                setActiveCategory("All");
                setActiveSubCategory("All");
                setSearchQuery("");
                searchParams.delete("category");
                setSearchParams(searchParams);
              }}
            >
              View All Products
            </button>
          </div>
        )}

        {/* Product Cards */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="products-grid">
            {filteredProducts.map((product) => {
              const productId = product._id || product.id;
              return (
                <ProductCard
                  key={`prod-item-${productId}`}
                  id={productId}
                  image={getProductImage(product)}
                  title={product.name || product.title}
                  category={product.subCategory || product.category || "SEEMZ"}
                  price={formatPrice(product.price)}
                />
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default Products;