import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ShoppingBag, 
  Check, 
  Sparkles, 
  RotateCcw, 
  Share2, 
  ChevronRight, 
  ChevronLeft,
  Layers, 
  Sliders, 
  Plus, 
  X, 
  Info,
  ArrowUpRight
} from "lucide-react";
import { getAllProducts } from "../../services/productservices";
import { useAuth } from "../../context/AuthContext";
import FashionIntro from "../../components/FashionIntro/FashionIntro";
import "./OutfitStudio.css";

const SLOTS = [
  { id: "top", label: "TOPWEAR", desc: "Shirts, T-shirts & Knits" },
  { id: "bottom", label: "BOTTOMS", desc: "Pants, Trousers & Jeans" },
  { id: "outerwear", label: "OUTERWEAR", desc: "Jackets & Coats" },
  { id: "shoes", label: "FOOTWEAR", desc: "Shoes & Boots" },
  { id: "accessories", label: "ACCESSORIES", desc: "Bags & Belts" }
];

function OutfitStudio() {
  const navigate = useNavigate();
  const { user, addToCart } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlot, setActiveSlot] = useState("top");
  
  // Selected piece for each slot
  const [selectedPieces, setSelectedPieces] = useState({
    top: null,
    bottom: null,
    outerwear: null,
    shoes: null,
    accessories: null
  });

  // Selected sizes for each slot
  const [selectedSizes, setSelectedSizes] = useState({
    top: "M",
    bottom: "M",
    outerwear: "L",
    shoes: "42",
    accessories: "O/S"
  });

  const [addingToBag, setAddingToBag] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Fetch catalog products
  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const data = await getAllProducts();
        if (data?.success && Array.isArray(data?.products)) {
          if (isMounted) {
            setProducts(data.products);
            
            // Auto-initialize default luxury ensemble from catalog
            const all = data.products;
            const tops = all.filter(p => isTop(p));
            const bottoms = all.filter(p => isBottom(p));
            const outers = all.filter(p => isOuterwear(p));
            const others = all.filter(p => !isTop(p) && !isBottom(p) && !isOuterwear(p));

            setSelectedPieces({
              top: tops[0] || all[0] || null,
              bottom: bottoms[0] || all[1] || null,
              outerwear: outers[0] || all[2] || null,
              shoes: others[0] || all[3] || null,
              accessories: others[1] || all[4] || null
            });
          }
        }
      } catch (err) {
        console.error("Failed to load studio catalog:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCatalog();
    return () => { isMounted = false; };
  }, []);

  // Classification helpers
  const isTop = (p) => {
    const text = `${p.name} ${p.category} ${p.subCategory || ""}`.toLowerCase();
    return text.includes("shirt") || text.includes("top") || text.includes("t-shirt") || text.includes("hoodie") || text.includes("sweater") || text.includes("knit") || text.includes("polo");
  };

  const isBottom = (p) => {
    const text = `${p.name} ${p.category} ${p.subCategory || ""}`.toLowerCase();
    return text.includes("pant") || text.includes("trouser") || text.includes("jean") || text.includes("bottom") || text.includes("short") || text.includes("skirt") || text.includes("cargo");
  };

  const isOuterwear = (p) => {
    const text = `${p.name} ${p.category} ${p.subCategory || ""}`.toLowerCase();
    return text.includes("jacket") || text.includes("coat") || text.includes("blazer") || text.includes("outer") || text.includes("trench") || text.includes("bomber") || text.includes("overcoat");
  };

  const isFootwear = (p) => {
    const text = `${p.name} ${p.category} ${p.subCategory || ""}`.toLowerCase();
    return text.includes("shoe") || text.includes("boot") || text.includes("loafer") || text.includes("sneaker") || text.includes("footwear") || text.includes("mule");
  };

  const isAccessory = (p) => {
    const text = `${p.name} ${p.category} ${p.subCategory || ""}`.toLowerCase();
    return text.includes("bag") || text.includes("belt") || text.includes("sunglass") || text.includes("scarf") || text.includes("hat") || text.includes("cap") || text.includes("wallet") || text.includes("accessory");
  };

  // Filter items available for current active slot
  const slotItems = useMemo(() => {
    if (!products.length) return [];
    
    let filtered = [];
    if (activeSlot === "top") filtered = products.filter(isTop);
    else if (activeSlot === "bottom") filtered = products.filter(isBottom);
    else if (activeSlot === "outerwear") filtered = products.filter(isOuterwear);
    else if (activeSlot === "shoes") filtered = products.filter(isFootwear);
    else if (activeSlot === "accessories") filtered = products.filter(isAccessory);

    // If specific filter returns few items, provide fallback subset of products
    if (filtered.length < 2) {
      if (activeSlot === "top") filtered = products.slice(0, 6);
      else if (activeSlot === "bottom") filtered = products.slice(2, 8);
      else if (activeSlot === "outerwear") filtered = products.slice(1, 7);
      else if (activeSlot === "shoes") filtered = products.slice(3, 9);
      else filtered = products.slice(4, 10);
    }
    return filtered;
  }, [products, activeSlot]);

  // Aggregate Calculations
  const activeEnsembleList = useMemo(() => {
    return Object.entries(selectedPieces)
      .filter(([_, item]) => item !== null)
      .map(([slotKey, item]) => ({
        slotKey,
        item,
        size: selectedSizes[slotKey] || "M"
      }));
  }, [selectedPieces, selectedSizes]);

  const totalInvestment = useMemo(() => {
    return activeEnsembleList.reduce((sum, { item }) => sum + (Number(item?.price) || 0), 0);
  }, [activeEnsembleList]);

  // Handle Piece Selection
  const handleSelectPiece = (product) => {
    setSelectedPieces((prev) => ({
      ...prev,
      [activeSlot]: product
    }));

    // Auto set default size if available
    if (Array.isArray(product?.sizes) && product.sizes.length > 0) {
      setSelectedSizes((prev) => ({
        ...prev,
        [activeSlot]: product.sizes[0]
      }));
    }
  };

  // Remove Slot Item
  const handleRemoveSlot = (slotKey, e) => {
    e.stopPropagation();
    setSelectedPieces((prev) => ({
      ...prev,
      [slotKey]: null
    }));
  };

  // Change Size for active slot
  const handleSelectSize = (sz) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [activeSlot]: sz
    }));
  };

  // Add all selected pieces to bag
  const handleAddCompleteLook = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (activeEnsembleList.length === 0) {
      setToastMessage("Please select at least one item for your outfit.");
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }

    try {
      setAddingToBag(true);
      for (const { item, size } of activeEnsembleList) {
        await addToCart(item._id, 1, size);
      }
      setAddedSuccess(true);
      setToastMessage(`${activeEnsembleList.length} items added to your Shopping Bag.`);
      setTimeout(() => {
        setAddedSuccess(false);
        setToastMessage("");
      }, 3500);
    } catch (err) {
      console.error("Studio add to bag error:", err);
      setToastMessage("Could not add look to bag. Please try again.");
      setTimeout(() => setToastMessage(""), 3500);
    } finally {
      setAddingToBag(false);
    }
  };

  // Reset Atelier
  const handleResetAtelier = () => {
    setSelectedPieces({
      top: null,
      bottom: null,
      outerwear: null,
      shoes: null,
      accessories: null
    });
    setToastMessage("Outfit cleared.");
    setTimeout(() => setToastMessage(""), 2000);
  };

  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `₹${price.toLocaleString("en-IN")}`;
    }
    return price || "";
  };

  const getProductImage = (p) => {
    if (!p) return "";
    if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
    return p.image || "";
  };

  return (
    <main className="outfit-studio-page">
      {/* ================= ATELIER CINEMATIC SEQUENCE ================= */}
      <FashionIntro
        title="SEEMZ STUDIO"
        subtitle="DIGITAL ATELIER • EXHIBIT 01"
        skipText="CUSTOMIZE IN STUDIO"
        skipTargetId="studio-workspace-section"
      />

      {/* ================= STUDIO INTERACTIVE WORKSPACE ================= */}
      <div id="studio-workspace-section" className="studio-workspace-section">
        {/* Studio Header Bar */}
        <section className="studio-top-hero">
          <div className="studio-hero-content">
            <div className="studio-hero-kicker-row">
              <span className="studio-badge-kicker">SEEMZ STUDIO // DIGITAL ATELIER</span>
              <div className="studio-hero-telemetry">
                <span className="telemetry-pill-dot" />
                <span>{activeEnsembleList.length} OF 5 PIECES EQUIPPED</span>
              </div>
            </div>
            <h1 className="studio-main-heading">Outfit Builder & Atelier</h1>
            <p className="studio-intro-text">
              Curate and customize your ensemble. Select garments across foundational layers to compose your signature silhouette.
            </p>
          </div>
        </section>

        {/* Main Dual-Flank Atelier Interface */}
        <div className="studio-workspace">
          {/* Left Flank: Slot Navigation Bar */}
          <aside className="studio-slots-sidebar">
            <div className="slots-sidebar-header">
              <div className="sidebar-title-block">
                <span className="sidebar-kicker">ATELIER LAYERS</span>
                <h3 className="sidebar-subheading">Outfit Slots</h3>
              </div>
              <button 
                type="button" 
                className="studio-reset-btn" 
                onClick={handleResetAtelier}
                title="Clear all pieces"
              >
                <RotateCcw size={12} /> Clear All
              </button>
            </div>

            <div className="slots-list">
              {SLOTS.map((slot, index) => {
                const piece = selectedPieces[slot.id];
                const isActive = activeSlot === slot.id;
                const img = getProductImage(piece);

                return (
                  <button
                    key={slot.id}
                    type="button"
                    className={`slot-card-btn ${isActive ? "active" : ""} ${piece ? "filled" : "empty"}`}
                    onClick={() => setActiveSlot(slot.id)}
                  >
                    <div className="slot-idx-num">0{index + 1}</div>
                    <div className="slot-thumb-box">
                      {piece && img ? (
                        <img src={img} alt={piece.name} />
                      ) : (
                        <div className="empty-slot-icon">
                          <Plus size={16} />
                        </div>
                      )}
                    </div>

                    <div className="slot-card-details">
                      <span className="slot-name">{slot.label}</span>
                      {piece ? (
                        <>
                          <h4 className="slot-piece-name">{piece.name}</h4>
                          <span className="slot-piece-price">{formatPrice(piece.price)}</span>
                        </>
                      ) : (
                        <span className="slot-empty-prompt">Select {slot.label}</span>
                      )}
                    </div>

                    {piece && (
                      <button
                        type="button"
                        className="slot-remove-btn"
                        onClick={(e) => handleRemoveSlot(slot.id, e)}
                        title={`Remove ${slot.label}`}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Center Stage: Interactive Visual Mannequin & Composition Viewer */}
          <section className="studio-center-stage">
            <div className="stage-pedestal-wrapper">
              {/* Overhead Luminous Studio Spotlight Beam */}
              <div className="stage-spotlight-beam" />
              <div className="pedestal-ambient-light" />
              
              {/* Architectural Mannequin Stand Armature (Behind Garments) */}
              <div className="mannequin-armature-wireframe" />

              <div className="mannequin-composition-box">
                {/* Active Outfit Layer Cards or Empty Wireframe Stand */}
                {activeEnsembleList.length === 0 ? (
                  <div className="stage-empty-state">
                    <div className="empty-wireframe-stand">
                      <div className="wireframe-bust" />
                      <div className="wireframe-spine" />
                      <div className="wireframe-base" />
                    </div>
                    <h3>Armature Empty</h3>
                    <p>Select garments from the left slots or right drawer to begin assembling your silhouette.</p>
                  </div>
                ) : (
                  <div className="composition-layers-stack">
                    {/* Layer Outerwear */}
                    {selectedPieces.outerwear && (
                      <div 
                        className={`layer-item layer-outerwear ${activeSlot === "outerwear" ? "is-selected-layer" : ""}`}
                        onClick={() => setActiveSlot("outerwear")}
                        title="Click to customize Outerwear"
                      >
                        <div className="layer-img-container">
                          <img src={getProductImage(selectedPieces.outerwear)} alt="Outerwear" />
                        </div>
                        <div className="layer-floating-badge">
                          <span className="layer-tag-label">01 // OUTERWEAR</span>
                          <span className="layer-tag-title">{selectedPieces.outerwear.name}</span>
                          <span className="layer-tag-price">{formatPrice(selectedPieces.outerwear.price)}</span>
                        </div>
                      </div>
                    )}

                    {/* Layer Top */}
                    {selectedPieces.top && (
                      <div 
                        className={`layer-item layer-top ${activeSlot === "top" ? "is-selected-layer" : ""}`}
                        onClick={() => setActiveSlot("top")}
                        title="Click to customize Topwear"
                      >
                        <div className="layer-img-container">
                          <img src={getProductImage(selectedPieces.top)} alt="Topwear" />
                        </div>
                        <div className="layer-floating-badge">
                          <span className="layer-tag-label">02 // TOPWEAR</span>
                          <span className="layer-tag-title">{selectedPieces.top.name}</span>
                          <span className="layer-tag-price">{formatPrice(selectedPieces.top.price)}</span>
                        </div>
                      </div>
                    )}

                    {/* Layer Bottom */}
                    {selectedPieces.bottom && (
                      <div 
                        className={`layer-item layer-bottom ${activeSlot === "bottom" ? "is-selected-layer" : ""}`}
                        onClick={() => setActiveSlot("bottom")}
                        title="Click to customize Bottoms"
                      >
                        <div className="layer-img-container">
                          <img src={getProductImage(selectedPieces.bottom)} alt="Bottoms" />
                        </div>
                        <div className="layer-floating-badge">
                          <span className="layer-tag-label">03 // BOTTOMS</span>
                          <span className="layer-tag-title">{selectedPieces.bottom.name}</span>
                          <span className="layer-tag-price">{formatPrice(selectedPieces.bottom.price)}</span>
                        </div>
                      </div>
                    )}

                    {/* Layer Shoes */}
                    {selectedPieces.shoes && (
                      <div 
                        className={`layer-item layer-shoes ${activeSlot === "shoes" ? "is-selected-layer" : ""}`}
                        onClick={() => setActiveSlot("shoes")}
                        title="Click to customize Footwear"
                      >
                        <div className="layer-img-container">
                          <img src={getProductImage(selectedPieces.shoes)} alt="Footwear" />
                        </div>
                        <div className="layer-floating-badge">
                          <span className="layer-tag-label">04 // FOOTWEAR</span>
                          <span className="layer-tag-title">{selectedPieces.shoes.name}</span>
                          <span className="layer-tag-price">{formatPrice(selectedPieces.shoes.price)}</span>
                        </div>
                      </div>
                    )}

                    {/* Layer Accessories */}
                    {selectedPieces.accessories && (
                      <div 
                        className={`layer-item layer-accessories ${activeSlot === "accessories" ? "is-selected-layer" : ""}`}
                        onClick={() => setActiveSlot("accessories")}
                        title="Click to customize Accessories"
                      >
                        <div className="layer-img-container">
                          <img src={getProductImage(selectedPieces.accessories)} alt="Accessories" />
                        </div>
                        <div className="layer-floating-badge">
                          <span className="layer-tag-label">05 // ACCESSORY</span>
                          <span className="layer-tag-title">{selectedPieces.accessories.name}</span>
                          <span className="layer-tag-price">{formatPrice(selectedPieces.accessories.price)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Illuminated Runway Pedestal Floor Ring */}
                <div className="pedestal-floor-ring">
                  <div className="floor-ring-light" />
                  <div className="pedestal-base-plate">
                    <span>SEEMZ DIGITAL ATELIER &bull; RUNWAY MATRIX</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

        {/* Right Flank: Garment Drawer & Size Selector */}
        <aside className="studio-drawer-sidebar">
          <div className="drawer-sidebar-header">
            <div className="drawer-title-group">
              <span className="drawer-kicker">ACTIVE SLOT</span>
              <h3 className="drawer-slot-title">
                {SLOTS.find(s => s.id === activeSlot)?.label || "TOPWEAR"}
              </h3>
            </div>
            <span className="drawer-item-count">{slotItems.length} ITEMS AVAILABLE</span>
          </div>

          {/* Currently Selected Piece in Active Slot Banner */}
          {selectedPieces[activeSlot] && (
            <div className="current-slot-preview-card">
              <div className="csp-img-box">
                <img src={getProductImage(selectedPieces[activeSlot])} alt="Selected" />
              </div>
              <div className="csp-info">
                <span className="csp-active-badge">SELECTED</span>
                <h4 className="csp-name">{selectedPieces[activeSlot].name}</h4>
                <span className="csp-price">{formatPrice(selectedPieces[activeSlot].price)}</span>
                
                {/* Size Selector for Equipped Piece */}
                {Array.isArray(selectedPieces[activeSlot]?.sizes) && selectedPieces[activeSlot].sizes.length > 0 && (
                  <div className="csp-sizes-row">
                    <span className="csp-size-label">SIZE:</span>
                    <div className="csp-size-pills">
                      {selectedPieces[activeSlot].sizes.map(sz => (
                        <button
                          key={sz}
                          type="button"
                          className={`csp-size-btn ${selectedSizes[activeSlot] === sz ? "active" : ""}`}
                          onClick={() => handleSelectSize(sz)}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Swappable Garment Carousel / Grid */}
          <div className="drawer-garments-scroll">
            {loading ? (
              <div className="studio-loading-state">
                <div className="studio-loader-bar" />
                <span>Loading items...</span>
              </div>
            ) : (
              <div className="drawer-garments-grid">
                {slotItems.map((item) => {
                  const isEquipped = selectedPieces[activeSlot]?._id === item._id;
                  const itemImg = getProductImage(item);

                  return (
                    <div
                      key={item._id}
                      className={`drawer-garment-card ${isEquipped ? "is-equipped" : ""}`}
                      onClick={() => handleSelectPiece(item)}
                    >
                      <div className="dgc-image-box">
                        <img src={itemImg} alt={item.name} />
                        {isEquipped && (
                          <div className="dgc-equipped-overlay">
                            <Check size={16} strokeWidth={3} />
                            <span>SELECTED</span>
                          </div>
                        )}
                      </div>

                      <div className="dgc-details">
                        <span className="dgc-brand">{item.brand || "SEEMZ"}</span>
                        <h4 className="dgc-title">{item.name}</h4>
                        <div className="dgc-footer">
                          <span className="dgc-price">{formatPrice(item.price)}</span>
                          <button
                            type="button"
                            className="dgc-equip-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPiece(item);
                            }}
                          >
                            {isEquipped ? "SELECTED" : "SELECT"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Live Aggregate Ledger & Global Action Footer */}
      <footer className="studio-action-dock">
        <div className="dock-container">
          <div className="dock-ensemble-summary">
            <span className="dock-kicker">OUTFIT SUMMARY</span>
            <div className="dock-pieces-pills">
              {SLOTS.map((s) => {
                const p = selectedPieces[s.id];
                return (
                  <span
                    key={s.id}
                    className={`dock-slot-pill ${p ? "has-item" : "is-missing"}`}
                    onClick={() => setActiveSlot(s.id)}
                  >
                    {s.label}: <strong>{p ? p.name.slice(0, 16) + "..." : "EMPTY"}</strong>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="dock-financials-cta">
            <div className="dock-price-stack">
              <span className="dock-pieces-count">{activeEnsembleList.length} {activeEnsembleList.length === 1 ? "ITEM SELECTED" : "ITEMS SELECTED"}</span>
              <span className="dock-grand-total">₹{totalInvestment.toLocaleString("en-IN")}</span>
            </div>

            <button
              type="button"
              className={`dock-add-bag-btn ${addedSuccess ? "success" : ""}`}
              onClick={handleAddCompleteLook}
              disabled={addingToBag || activeEnsembleList.length === 0}
            >
              {addedSuccess ? (
                <>
                  <Check size={18} /> LOOK ADDED TO BAG
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  {addingToBag ? "ADDING TO BAG..." : "ADD LOOK TO BAG"}
                </>
              )}
            </button>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="studio-toast-banner">
          <span>{toastMessage}</span>
        </div>
      )}
      </div>
    </main>
  );
}

export default OutfitStudio;
