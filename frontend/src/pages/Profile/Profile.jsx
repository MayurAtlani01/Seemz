import "./Profile.css";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  ShoppingBag,
  Package,
  LogOut,
  Shield,
  Edit3,
  Check,
  ArrowRight,
  UserCheck,
  Calendar,
  CreditCard,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../services/profileservices";
import { getMyOrders } from "../../services/orderservices";

function Profile() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isAdmin,
    loading,
    logout,
    wishlistItems,
    refreshUser,
  } = useAuth();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  // Active view tab: "all" | "dossier" | "orders"
  const [activeTab, setActiveTab] = useState("all");

  // Redirect unauthenticated user
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  // Sync edit form with user data
  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditPhone(user.phone || "");
    }
  }, [user]);

  // Fetch orders
  useEffect(() => {
    if (isAuthenticated) {
      const fetchOrders = async () => {
        try {
          setOrdersLoading(true);
          const data = await getMyOrders();
          if (data?.success && Array.isArray(data?.orders)) {
            setOrders(data.orders);
          }
        } catch {
          setOrders([]);
        } finally {
          setOrdersLoading(false);
        }
      };
      fetchOrders();
    }
  }, [isAuthenticated]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      setUpdateMsg("");
      const res = await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
      });
      if (res?.success) {
        setUpdateMsg("Profile updated successfully.");
        setIsEditing(false);
        refreshUser();
        setTimeout(() => setUpdateMsg(""), 3500);
      }
    } catch (err) {
      console.error(err);
      setUpdateMsg(err.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `₹${price.toLocaleString("en-IN")}`;
    }
    return price || "";
  };

  // Generate monogram initials
  const getInitials = (name) => {
    if (!name) return "SZ";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (loading || !user) {
    return (
      <main className="profile-page">
        <div className="profile-loading-box">
          <span className="profile-loading-kicker">SEEMZ</span>
          <p>Loading your profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      {/* LUXURY EDITORIAL HERO BANNER */}
      <section className="profile-hero">
        <div className="profile-hero-inner">
          <div className="profile-hero-content">
            <span className="profile-hero-tag">
              SEEMZ // MY ACCOUNT
            </span>

            <h1 className="profile-hero-title">
              Welcome, <span className="title-serif">{user.name?.split(" ")[0] || "there"}</span>
            </h1>

            <p className="profile-hero-subtitle">
              Manage your personal details, review your orders, and view your wishlist.
            </p>
          </div>

          {/* Luxury Monogram Emblem & Quick Status */}
          <div className="profile-monogram-box">
            <div className="profile-monogram-seal">
              <span className="seal-letters">{getInitials(user.name)}</span>
            </div>
            <div className="profile-tier-badge">
              <span className="tier-dot" />
              <span>{isAdmin ? "ADMIN" : "VERIFIED ACCOUNT"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* CLIENT STATS STRIP */}
      <section className="profile-ledger-strip">
        <div className="profile-ledger-inner">
          <div className="ledger-cell">
            <span className="ledger-num">{wishlistItems.length}</span>
            <span className="ledger-label">SAVED ITEMS</span>
            <Link to="/wishlist" className="ledger-action-link">
              View Wishlist →
            </Link>
          </div>

          <div className="ledger-cell">
            <span className="ledger-num">{orders.length}</span>
            <span className="ledger-label">TOTAL ORDERS</span>
            <span className="ledger-sub">Verified Purchases</span>
          </div>

          <div className="ledger-cell">
            <span className="ledger-num">{isAdmin ? "Admin" : "Member"}</span>
            <span className="ledger-label">ACCOUNT STATUS</span>
            <span className="ledger-sub">Free Shipping Over ₹2,999</span>
          </div>

          <div className="ledger-cell quick-actions-cell">
            <Link to="/cart" className="ledger-pill-btn">
              <ShoppingBag size={14} />
              <span>Bag</span>
            </Link>
            {isAdmin && (
              <Link to="/admin/products" className="ledger-pill-btn admin-pill">
                <Shield size={14} />
                <span>Admin</span>
              </Link>
            )}
            <button
              type="button"
              className="ledger-pill-btn signout-pill"
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION NAV TABS */}
      <div className="profile-nav-tabs-wrap">
        <div className="profile-nav-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            OVERVIEW
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "dossier" ? "active" : ""}`}
            onClick={() => setActiveTab("dossier")}
          >
            ACCOUNT DETAILS
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            ORDER HISTORY ({orders.length})
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="profile-container">
        {/* ========================================================
            1. ACCOUNT DETAILS
           ======================================================== */}
        {(activeTab === "all" || activeTab === "dossier") && (
          <section className="profile-dossier-section">
            <div className="dossier-header">
              <div className="dossier-heading-group">
                <span className="section-eyebrow">DETAILS // 01</span>
                <h2>Personal Details</h2>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  className="seemz-outline-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 size={13} />
                  <span>EDIT PROFILE</span>
                </button>
              )}
            </div>

            {updateMsg && (
              <div className="profile-atelier-alert">
                <Check size={14} color="#FFFFFF" />
                <span>{updateMsg}</span>
              </div>
            )}

            {!isEditing ? (
              <div className="dossier-grid">
                <div className="dossier-item">
                  <span className="item-kicker">01 // FULL NAME</span>
                  <p className="item-val primary-val">{user.name || "—"}</p>
                </div>

                <div className="dossier-item">
                  <span className="item-kicker">02 // EMAIL ADDRESS</span>
                  <p className="item-val">{user.email || "—"}</p>
                </div>

                <div className="dossier-item">
                  <span className="item-kicker">03 // PHONE NUMBER</span>
                  <p className="item-val">{user.phone || "Not provided"}</p>
                </div>

                <div className="dossier-item">
                  <span className="item-kicker">04 // MEMBERSHIP</span>
                  <p className="item-val tier-val">
                    {isAdmin ? "Administrator" : "Verified Customer"}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="dossier-edit-form">
                <div className="edit-fields-row">
                  <div className="edit-field">
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Mayur Atlani"
                    />
                  </div>

                  <div className="edit-field">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="edit-actions-row">
                  <button
                    type="button"
                    className="seemz-ghost-btn"
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(user.name || "");
                      setEditPhone(user.phone || "");
                    }}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="seemz-primary-btn"
                    disabled={saveLoading}
                  >
                    {saveLoading ? "SAVING..." : "SAVE CHANGES"}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* ========================================================
            2. ORDER HISTORY
           ======================================================== */}
        {(activeTab === "all" || activeTab === "orders") && (
          <section className="profile-archive-section">
            <div className="archive-header">
              <div className="archive-heading-group">
                <span className="section-eyebrow">ORDERS // 02</span>
                <h2>Order History</h2>
              </div>
              <span className="archive-count-tag">{orders.length} {orders.length === 1 ? "ORDER" : "ORDERS"}</span>
            </div>

            {ordersLoading ? (
              <div className="archive-loading-state">
                <p>Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="archive-empty-state">
                <Package size={36} strokeWidth={1} />
                <h3>No Orders Yet</h3>
                <p>
                  You haven't placed any orders yet. Discover our latest collections today.
                </p>
                <Link to="/products" className="seemz-primary-btn">
                  EXPLORE COLLECTION
                </Link>
              </div>
            ) : (
              <div className="archive-orders-grid">
                {orders.map((ord) => (
                  <article key={ord._id} className="acquisition-card">
                    {/* Order Reference Header */}
                    <div className="card-top-bar">
                      <div className="ref-info">
                        <span className="ref-kicker">ORDER ID</span>
                        <span className="ref-code">
                          #{ord._id.slice(-8).toUpperCase()}
                        </span>
                      </div>

                      <div className="date-info">
                        <span className="ref-kicker">DATE</span>
                        <span className="date-val">
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="status-badge-wrap">
                        <span
                          className={`acquisition-status-pill ${ord.orderStatus?.toLowerCase()}`}
                        >
                          {ord.orderStatus || "CONFIRMED"}
                        </span>
                      </div>
                    </div>

                    {/* Garments Line Items */}
                    <div className="card-garments-list">
                      {ord.items?.map((item, idx) => (
                        <div key={idx} className="garment-item-row">
                          <div className="garment-main-col">
                            <span className="garment-name">
                              {item.product?.name || "SEEMZ Garment"}
                            </span>
                            <span className="garment-meta">
                              Qty: {item.quantity} {item.size ? `· Size: ${item.size}` : ""}
                            </span>
                          </div>
                          <span className="garment-price">
                            {formatPrice((item.product?.price || 0) * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Financial Footer */}
                    <div className="card-bottom-bar">
                      <div className="payment-method-info">
                        <CreditCard size={13} color="rgba(255,255,255,0.4)" />
                        <span>Payment: {ord.paymentMethod?.toUpperCase() || "Cash on Delivery"}</span>
                      </div>

                      <div className="total-due-info">
                        <span className="total-label">Total</span>
                        <span className="total-value">{formatPrice(ord.totalAmount)}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default Profile;