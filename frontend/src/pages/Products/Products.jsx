import "./Products.css";
import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, ArrowUpDown } from "lucide-react";
import ProductCard from "../../components/ProductCard/ProductCard";
import { getAllProducts } from "../../services/productservices";
import imgFallback from "../../assets/images/product1.jpg";

const CATEGORIES = ["All", "Men", "Women", "New Arrivals"];

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const initialQuery = searchParams.get("q") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeSubCategory, setActiveSubCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Sync URL search params and auto-focus if requested
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && CATEGORIES.includes(cat)) {
      setActiveCategory(cat);
    } else if (!cat) {
      setActiveCategory("All");
    }

    const q = searchParams.get("q");
    if (q !== null && q !== undefined) {
      setSearchQuery(q);
    }

    const shouldFocus = searchParams.get("search") === "open" || searchParams.get("focus") === "search";
    if (shouldFocus) {
      // Focus search input and scroll gently into view
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 80);
      return () => clearTimeout(timer);
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
        activeCategory === "New Arrivals" ||
        p.category?.toLowerCase() === activeCategory.toLowerCase()
      ) {
        if (p.subCategory) subs.add(p.subCategory);
      }
    });
    return ["All", ...Array.from(subs)];
  }, [products, activeCategory]);

  // Comprehensive, case-insensitive, multi-token, partial search and filter
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
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    // Subcategory filter
    if (activeSubCategory !== "All") {
      list = list.filter(
        (p) => p.subCategory?.toLowerCase() === activeSubCategory.toLowerCase()
      );
    }

    // Search query filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const tokens = query.split(/\s+/).filter(Boolean);

      list = list.filter((p) => {
        const name = (p.name || p.title || "").toLowerCase();
        const brand = (p.brand || "").toLowerCase();
        const cat = (p.category || "").toLowerCase();
        const subCat = (p.subCategory || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const color = (p.color || "").toLowerCase();
        const colors = Array.isArray(p.colors) ? p.colors.join(" ").toLowerCase() : "";
        const tags = Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : "";
        const fabric = (p.fabric || p.material || "").toLowerCase();

        const combined = `${name} ${brand} ${cat} ${subCat} ${desc} ${color} ${colors} ${tags} ${fabric}`;

        // Match if direct phrase matches or if every search token exists in product fields
        return combined.includes(query) || tokens.every((token) => combined.includes(token));
      });
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
    const newParams = new URLSearchParams(searchParams);
    if (cat === "All") {
      newParams.delete("category");
    } else {
      newParams.set("category", cat);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      newParams.set("q", val);
    } else {
      newParams.delete("q");
    }
    newParams.delete("search");
    newParams.delete("focus");
    setSearchParams(newParams, { replace: true });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("q");
    newParams.delete("search");
    newParams.delete("focus");
    setSearchParams(newParams, { replace: true });
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setActiveCategory("All");
    setActiveSubCategory("All");
    setSortBy("newest");
    setSearchParams({}, { replace: true });
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

  const isSearchActive = Boolean(searchQuery.trim());

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

      {/* Prominent Search Bar Section */}
      <section className="products-search-section" ref={searchContainerRef}>
        <div className="products-search-bar-wrap">
          <div className="products-search-input-box">
            <Search size={18} className="search-box-icon" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search collections, garments, silhouettes, fabrics..."
              className="products-search-input"
              aria-label="Search collections and products"
              autoComplete="off"
            />
            {isSearchActive && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search text"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {isSearchActive && (
            <div className="search-active-pill">
              <span>
                Search results for: <strong>"{searchQuery.trim()}"</strong>
              </span>
              <button
                type="button"
                onClick={handleClearSearch}
                className="pill-clear-btn"
                aria-label="Reset search filter"
              >
                Clear <X size={12} />
              </button>
            </div>
          )}
        </div>
      </section>

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
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "Product" : "Products"}
            {isSearchActive && " found"}
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
            <div className="state-icon-wrap">
              <Search size={32} strokeWidth={1.3} />
            </div>
            <p className="state-title">
              {isSearchActive
                ? `No products found matching "${searchQuery.trim()}"`
                : "No products found in this category"}
            </p>
            <p className="state-desc">
              {isSearchActive
                ? "Check your spelling, try broader keywords (e.g. 'shirt', 'jacket', 'wool'), or reset your filters to explore all pieces."
                : "Try adjusting your selected category or explore our latest arrivals."}
            </p>
            <div className="state-btn-group">
              {isSearchActive && (
                <button className="state-btn" onClick={handleClearSearch}>
                  Clear Search
                </button>
              )}
              <button
                className={`state-btn ${isSearchActive ? "outline" : ""}`}
                onClick={resetAllFilters}
              >
                View All Collections
              </button>
            </div>
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