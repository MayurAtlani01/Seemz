import "./Profile.css";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Heart,
  ShoppingBag,
  Package,
  LogOut,
  Shield,
  Edit3,
  Check,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../services/profileservices";
import { getMyOrders } from "../../services/orderservices";

function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, loading, logout, wishlistItems, refreshUser } =
    useAuth();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

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
        setUpdateMsg("Profile updated successfully");
        setIsEditing(false);
        refreshUser();
      }
    } catch (err) {
      console.error(err);
      setUpdateMsg(err.response?.data?.message || "Failed to update profile");
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

  if (loading || !user) {
    return (
      <main className="profile-page">
        <div className="profile-loading-box">
          <p>Loading your private account...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <div className="profile-container">
        {/* Profile Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-user-card">
            <div className="profile-avatar">
              <User size={36} strokeWidth={1.2} />
            </div>

            <span className="profile-role-badge">
              {isAdmin ? "MASTER ADMINISTRATOR" : "PRIVILEGED CLIENT"}
            </span>

            <h2>{user.name}</h2>
            <p className="profile-email">{user.email}</p>
            {user.phone && <p className="profile-phone">{user.phone}</p>}
          </div>

          <nav className="profile-nav-menu">
            <Link to="/wishlist" className="profile-nav-item">
              <Heart size={18} />
              <span>Wishlist</span>
              <span className="nav-badge">{wishlistItems.length}</span>
            </Link>

            <Link to="/cart" className="profile-nav-item">
              <ShoppingBag size={18} />
              <span>Shopping Bag</span>
            </Link>

            {isAdmin && (
              <Link to="/admin/products" className="profile-nav-item admin-nav-item">
                <Shield size={18} />
                <span>Admin Product Panel</span>
                <ArrowRight size={14} />
              </Link>
            )}

            <button type="button" className="profile-logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Profile Main Content */}
        <div className="profile-content">
          {/* Quick Metrics */}
          <div className="profile-metrics-grid">
            <div className="metric-card">
              <span className="metric-label">SAVED PIECES</span>
              <h3 className="metric-val">{wishlistItems.length}</h3>
              <Link to="/wishlist" className="metric-link">
                View Wishlist →
              </Link>
            </div>

            <div className="metric-card">
              <span className="metric-label">TOTAL ORDERS</span>
              <h3 className="metric-val">{orders.length}</h3>
              <span className="metric-sub">Verified Purchases</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">MEMBERSHIP</span>
              <h3 className="metric-val">{isAdmin ? "Admin" : "SEEMZ Elite"}</h3>
              <span className="metric-sub">Complimentary Delivery</span>
            </div>
          </div>

          {/* Account Details Section */}
          <section className="profile-section-card">
            <div className="section-card-header">
              <div>
                <span className="section-eyebrow">PERSONAL DETAILS</span>
                <h3>Account Information</h3>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  className="edit-details-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 size={15} /> Edit
                </button>
              )}
            </div>

            {updateMsg && (
              <div className="profile-alert">
                <span>{updateMsg}</span>
              </div>
            )}

            {!isEditing ? (
              <div className="details-read-grid">
                <div className="read-item">
                  <label>Full Name</label>
                  <p>{user.name || "—"}</p>
                </div>
                <div className="read-item">
                  <label>Email Address</label>
                  <p>{user.email || "—"}</p>
                </div>
                <div className="read-item">
                  <label>Phone Number</label>
                  <p>{user.phone || "Not provided"}</p>
                </div>
                <div className="read-item">
                  <label>Account Role</label>
                  <p style={{ textTransform: "capitalize" }}>{user.role || "User"}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="profile-edit-form">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="save-btn"
                    disabled={saveLoading}
                  >
                    {saveLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Orders Section */}
          <section className="profile-section-card">
            <div className="section-card-header">
              <div>
                <span className="section-eyebrow">ORDER HISTORY</span>
                <h3>Recent Purchases</h3>
              </div>
            </div>

            {ordersLoading ? (
              <div className="orders-loading">
                <p>Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="orders-empty">
                <Package size={36} strokeWidth={1} />
                <p>You have not placed any orders yet.</p>
                <Link to="/products" className="shop-orders-btn">
                  Explore Collection
                </Link>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((ord) => (
                  <div key={ord._id} className="order-card">
                    <div className="order-header-row">
                      <div>
                        <span className="order-id">ORDER #{ord._id.slice(-8).toUpperCase()}</span>
                        <span className="order-date">
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <span className={`order-status ${ord.orderStatus?.toLowerCase()}`}>
                        {ord.orderStatus || "Processing"}
                      </span>
                    </div>

                    <div className="order-items-preview">
                      {ord.items?.map((item, idx) => (
                        <div key={idx} className="order-item-row">
                          <span>{item.product?.name || "SEEMZ Garment"} × {item.quantity}</span>
                          <span>{formatPrice(item.product?.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="order-footer-row">
                      <span>Total Paid: <strong>{formatPrice(ord.totalAmount)}</strong></span>
                      <span className="payment-badge">{ord.paymentMethod || "COD"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default Profile;