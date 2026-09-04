import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ShoppingBag, Plus, Sparkles, Layers } from "lucide-react";
import { getAllProducts } from "../../services/productservices";
import { useAuth } from "../../context/AuthContext";
import "./CompleteTheLook.css";

/**
 * CompleteTheLook — Curated Sartorial Ensemble Component
 * Pairs current garment with complementary wardrobe elements and supports bulk ensemble add to bag.
 */
function CompleteTheLook({ currentProduct, onAddedToCart }) {
  const navigate = useNavigate();
  const { user, addToCart } = useAuth();

  const [complementaryItems, setComplementaryItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAddingEnsemble, setIsAddingEnsemble] = useState(false);
  const [ensembleAdded, setEnsembleAdded] = useState(false);
  const [ensembleError, setEnsembleError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchLooks = async () => {
      try {
        const data = await getAllProducts();
        if (data?.success && Array.isArray(data?.products)) {
          const others = data.products.filter(
            (p) => String(p._id) !== String(currentProduct?._id)
          );

          // Find items from distinct categories or styles to create a cohesive ensemble
          let picks = [];
          const currentCat = (currentProduct?.category || "").toLowerCase();

          // Try to pick one bottom/trouser, one outerwear/jacket, one accessory/footwear
          const bottoms = others.filter((p) => {
            const name = (p.name || "").toLowerCase();
            const cat = (p.category || "").toLowerCase();
            return cat.includes("bottom") || cat.includes("pant") || cat.includes("trouser") || name.includes("pant") || name.includes("trouser") || name.includes("jean");
          });

          const outerwear = others.filter((p) => {
            const name = (p.name || "").toLowerCase();
            const cat = (p.category || "").toLowerCase();
            return cat.includes("outer") || cat.includes("jacket") || cat.includes("coat") || name.includes("jacket") || name.includes("blazer") || name.includes("coat");
          });

          const topsOrAcc = others.filter((p) => {
            const name = (p.name || "").toLowerCase();
            const cat = (p.category || "").toLowerCase();
            return !bottoms.some(b => b._id === p._id) && !outerwear.some(o => o._id === p._id);
          });

          if (currentCat.includes("top") || currentCat.includes("shirt") || currentCat.includes("hoodie") || currentCat.includes("men") || currentCat.includes("women")) {
            if (bottoms.length > 0) picks.push(bottoms[0]);
            if (outerwear.length > 0 && picks.length < 2) picks.push(outerwear[0]);
            if (topsOrAcc.length > 0 && picks.length < 3) picks.push(topsOrAcc[0]);
          }

          // Fallback to first available items if specific slots aren't uniquely categorized
          if (picks.length < 2) {
            picks = others.slice(0, 3);
          }

          if (isMounted) {
            setComplementaryItems(picks.slice(0, 3));
            setSelectedIds(picks.slice(0, 3).map((p) => p._id));
          }
        }
      } catch (err) {
        console.warn("Could not load look items", err);
      }
    };

    if (currentProduct?._id) {
      fetchLooks();
    }
    return () => {
      isMounted = false;
    };
  }, [currentProduct]);

  if (!complementaryItems || complementaryItems.length === 0) {
    return null;
  }

  // Calculate ensemble total
  const ensembleItems = [
    { ...currentProduct, isCurrent: true },
    ...complementaryItems.filter((item) => selectedIds.includes(item._id)),
  ];

  const totalInvestment = ensembleItems.reduce(
    (acc, curr) => acc + (Number(curr.price) || 0),
    0
  );

  const toggleItem = (itemId) => {
    setSelectedIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleAddEnsembleToBag = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setIsAddingEnsemble(true);
      setEnsembleError("");

      // Add each selected complementary item + current garment
      const allToAdd = [
        {
          id: currentProduct._id,
          size: Array.isArray(currentProduct.sizes) && currentProduct.sizes[0] ? currentProduct.sizes[0] : "M"
        },
        ...complementaryItems
          .filter((item) => selectedIds.includes(item._id))
          .map((item) => ({
            id: item._id,
            size: Array.isArray(item.sizes) && item.sizes[0] ? item.sizes[0] : "M"
          }))
      ];

      for (const item of allToAdd) {
        await addToCart(item.id, 1, item.size);
      }

      setEnsembleAdded(true);
      if (onAddedToCart) onAddedToCart();
      setTimeout(() => setEnsembleAdded(false), 3000);
    } catch (err) {
      console.error("Ensemble add error:", err);
      setEnsembleError("Failed to add complete look. Please try again.");
    } finally {
      setIsAddingEnsemble(false);
    }
  };

  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `₹${price.toLocaleString("en-IN")}`;
    }
    return price || "";
  };

  return (
    <section className="complete-the-look-section">
      <div className="ctl-header">
        <div className="ctl-title-group">
          <span className="ctl-kicker">CURATED LOOK</span>
          <h2 className="ctl-title">Complete The Look</h2>
        </div>
        <p className="ctl-subtitle">
          Curated pairings designed to match this piece.
        </p>
      </div>

      <div className="ctl-grid">
        {/* Current Anchor Garment */}
        <div className="ctl-card is-anchor">
          <div className="ctl-img-wrapper">
            <img
              src={
                Array.isArray(currentProduct.images) && currentProduct.images[0]
                  ? currentProduct.images[0]
                  : currentProduct.image
              }
              alt={currentProduct.name}
            />
            <span className="ctl-anchor-tag">THIS ITEM</span>
          </div>
          <div className="ctl-card-info">
            <span className="ctl-card-brand">{currentProduct.brand || "SEEMZ"}</span>
            <h4 className="ctl-card-name">{currentProduct.name}</h4>
            <span className="ctl-card-price">{formatPrice(currentProduct.price)}</span>
          </div>
        </div>

        {/* Complementary Items */}
        {complementaryItems.map((item) => {
          const isChecked = selectedIds.includes(item._id);
          const itemImg = Array.isArray(item.images) && item.images[0]
            ? item.images[0]
            : item.image;

          return (
            <div key={item._id} className={`ctl-card ${isChecked ? "selected" : ""}`}>
              <button
                type="button"
                className="ctl-select-toggle"
                onClick={() => toggleItem(item._id)}
                aria-label={isChecked ? "Deselect item" : "Select item"}
              >
                <span className={`ctl-checkbox ${isChecked ? "checked" : ""}`}>
                  {isChecked && <Check size={12} strokeWidth={2.5} />}
                </span>
              </button>

              <Link to={`/products/${item._id}`} className="ctl-img-wrapper">
                <img src={itemImg} alt={item.name} />
              </Link>

              <div className="ctl-card-info">
                <span className="ctl-card-brand">{item.brand || "SEEMZ"}</span>
                <Link to={`/products/${item._id}`} className="ctl-card-name-link">
                  <h4 className="ctl-card-name">{item.name}</h4>
                </Link>
                <div className="ctl-card-footer">
                  <span className="ctl-card-price">{formatPrice(item.price)}</span>
                  <span className="ctl-card-cat">{item.category || "Collection"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Aggregate Ledger & Action Bar */}
      <div className="ctl-action-bar">
        <div className="ctl-ledger">
          <span className="ctl-ledger-label">
            TOTAL FOR {ensembleItems.length} {ensembleItems.length === 1 ? "ITEM" : "ITEMS"}
          </span>
          <div className="ctl-ledger-price-row">
            <span className="ctl-ledger-price">₹{totalInvestment.toLocaleString("en-IN")}</span>
            <span className="ctl-ledger-taxes">INCL. ALL TAXES</span>
          </div>
        </div>

        <button
          type="button"
          className={`ctl-add-btn ${ensembleAdded ? "added" : ""}`}
          onClick={handleAddEnsembleToBag}
          disabled={isAddingEnsemble || ensembleItems.length === 0}
        >
          {ensembleAdded ? (
            <>
              <Check size={16} /> LOOK ADDED TO BAG
            </>
          ) : (
            <>
              <ShoppingBag size={16} />
              {isAddingEnsemble ? "ADDING LOOK..." : "ADD LOOK TO BAG"}
            </>
          )}
        </button>
      </div>

      {ensembleError && (
        <p className="ctl-error-text">{ensembleError}</p>
      )}
    </section>
  );
}

export default CompleteTheLook;
