import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Package,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User as UserIcon,
  MapPin,
  CreditCard,
  Layers,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { getAllOrdersAdmin, cancelOrderAdmin, deliverOrderAdmin } from "../../services/orderservices";
import { useAuth } from "../../context/AuthContext";
import imgFallback from "../../assets/images/product1.jpg";
import "./AdminOrders.css";

function AdminOrders() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Success / Error messages
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllOrdersAdmin();
      if (data?.success && Array.isArray(data?.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Error loading admin orders:", err);
      setErrorMessage("Could not retrieve orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }
      if (!isAdmin) {
        navigate("/");
        return;
      }
      fetchOrders();
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate]);

  const handleCancelOrder = async (orderId) => {
    if (actionLoading) return;

    if (!window.confirm("Are you sure you want to cancel this order? This will restore the stock level of all included items and cannot be undone.")) {
      return;
    }

    try {
      setActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const data = await cancelOrderAdmin(orderId);

      if (data?.success) {
        setSuccessMessage(data.message || "Order cancelled successfully.");
        
        // Update local state lists
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? data.order : o))
        );
        
        // Update currently open details modal
        setSelectedOrder(data.order);
      }
    } catch (err) {
      console.error("Order cancellation failure:", err);
      setErrorMessage(
        err.response?.data?.message || "Failed to cancel order. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliverOrder = async (orderId) => {
    if (actionLoading) return;

    if (!window.confirm("Are you sure you want to mark this order as Delivered? This status update is permanent.")) {
      return;
    }

    try {
      setActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const data = await deliverOrderAdmin(orderId);

      if (data?.success) {
        setSuccessMessage(data.message || "Order marked as Delivered successfully.");
        
        // Update local state lists
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? data.order : o))
        );
        
        // Update currently open details modal
        setSelectedOrder(data.order);
      }
    } catch (err) {
      console.error("Order delivery marking failure:", err);
      setErrorMessage(
        err.response?.data?.message || "Failed to update order status. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `₹${price.toLocaleString("en-IN")}`;
    }
    return price || "";
  };

  // Filter and search logic
  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = statusFilter === "All" || ord.orderStatus === statusFilter;
    
    const customerName = ord.user?.name?.toLowerCase() || "";
    const customerEmail = ord.user?.email?.toLowerCase() || "";
    const orderId = ord._id?.toLowerCase() || "";
    
    const matchesSearch =
      customerName.includes(searchTerm.toLowerCase()) ||
      customerEmail.includes(searchTerm.toLowerCase()) ||
      orderId.includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusClass = (status) => {
    return status?.toLowerCase() || "pending";
  };

  if (loading || authLoading) {
    return (
      <main className="admin-orders-page">
        <div className="admin-orders-loading">
          <p>Retrieving purchase archives...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-orders-page">
      {/* HEADER */}
      <header className="admin-orders-header">
        <div>
          <span className="admin-orders-badge">SEEMZ ATELIER ADMINISTRATION</span>
          <h1>Client Orders</h1>
          <p>Manage clientele orders, cancellations, and logistics status.</p>
        </div>
        <div className="admin-nav-actions">
          <Link to="/admin/products" className="admin-nav-btn">
            Manage Products
          </Link>
        </div>
      </header>

      {/* FEEDBACK BANNERS */}
      <div className="admin-orders-container">
        {successMessage && (
          <div className="admin-alert success">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
            <button className="alert-close" onClick={() => setSuccessMessage("")}><X size={14} /></button>
          </div>
        )}

        {errorMessage && (
          <div className="admin-alert error">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
            <button className="alert-close" onClick={() => setErrorMessage("")}><X size={14} /></button>
          </div>
        )}

        {/* CONTROLS */}
        <section className="admin-orders-controls">
          <div className="search-bar-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by ID, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="status-filters">
            {["All", "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`filter-tab ${statusFilter === status ? "active" : ""}`}
              >
                {status.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {/* ORDERS LIST */}
        <section className="orders-table-wrapper">
          {filteredOrders.length === 0 ? (
            <div className="empty-orders-view">
              <Package size={36} strokeWidth={1} />
              <h3>No Orders Found</h3>
              <p>No transactions match your search criteria.</p>
            </div>
          ) : (
            <table className="admin-orders-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>ORDER ID</th>
                  <th>CUSTOMER</th>
                  <th>ITEMS</th>
                  <th>TOTAL</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord) => {
                  const qtyTotal = ord.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                  return (
                    <tr key={ord._id}>
                      <td className="col-date">
                        {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="col-id font-mono">
                        #{ord._id.toUpperCase()}
                      </td>
                      <td className="col-customer">
                        <div className="cust-info">
                          <span className="cust-name">{ord.user?.name || "Bespoke Guest"}</span>
                          <span className="cust-email">{ord.user?.email || "N/A"}</span>
                        </div>
                      </td>
                      <td className="col-items">
                        {qtyTotal} {qtyTotal === 1 ? "Piece" : "Pieces"}
                      </td>
                      <td className="col-total font-mono">
                        {formatPrice(ord.totalAmount)}
                      </td>
                      <td className="col-status">
                        <span className={`status-badge ${getStatusClass(ord.orderStatus)}`}>
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="col-actions" style={{ textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="action-btn-view"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* DETAIL MODAL */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div>
                <span className="modal-eyebrow">ORDER DETAILS</span>
                <h2>ORDER #{selectedOrder._id.toUpperCase()}</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>
            </header>

            <div className="modal-body-scroller">
              <div className="modal-grid">
                {/* COLUMN 1: CLIENT & LOGISTICS */}
                <div className="modal-col">
                  {/* WHO ORDERED */}
                  <div className="details-section">
                    <h3><UserIcon size={16} /> Customer Information</h3>
                    <div className="details-card">
                      <p><strong>Name:</strong> {selectedOrder.user?.name || "Bespoke Client"}</p>
                      <p><strong>Email:</strong> {selectedOrder.user?.email || "N/A"}</p>
                      <p><strong>Customer ID:</strong> {selectedOrder.user?._id || "N/A"}</p>
                    </div>
                  </div>

                  {/* SHIPPING ADDRESS */}
                  <div className="details-section">
                    <h3><MapPin size={16} /> Shipping Details</h3>
                    {selectedOrder.address ? (
                      <div className="details-card">
                        <p><strong>Recipient:</strong> {selectedOrder.address.fullName}</p>
                        <p><strong>Phone:</strong> {selectedOrder.address.phone}</p>
                        <p><strong>Street:</strong> {selectedOrder.address.address}</p>
                        <p><strong>City/State:</strong> {selectedOrder.address.city}, {selectedOrder.address.state}</p>
                        <p><strong>Pincode/Country:</strong> {selectedOrder.address.pincode}, {selectedOrder.address.country}</p>
                      </div>
                    ) : (
                      <div className="details-card error-card">
                        <p><ShieldAlert size={14} /> Shipping address reference missing.</p>
                      </div>
                    )}
                  </div>

                  {/* METADATA */}
                  <div className="details-section">
                    <h3><CreditCard size={16} /> Transaction Overview</h3>
                    <div className="details-card">
                      <p><strong>Order Status:</strong> <span className={`status-badge ${getStatusClass(selectedOrder.orderStatus)}`}>{selectedOrder.orderStatus}</span></p>
                      <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod || "COD (Cash on Delivery)"}</p>
                      <p><strong>Placed On:</strong> {new Date(selectedOrder.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}</p>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: WHAT WAS ORDERED */}
                <div className="modal-col">
                  <div className="details-section">
                    <h3><Package size={16} /> Products Ordered</h3>
                    <div className="products-list-card">
                      {selectedOrder.items?.map((item, idx) => {
                        const p = item.product;
                        const img = Array.isArray(p?.images) && p.images.length > 0
                          ? p.images[0]
                          : p?.image || imgFallback;
                        return (
                          <div key={idx} className="modal-product-row">
                            <div className="product-row-thumb">
                              <img src={img} alt={p?.name || "Garment"} />
                            </div>
                            <div className="product-row-meta">
                              <h4>{p?.name || "Luxury Garment"}</h4>
                              <div className="meta-sub">
                                <span>Qty: <strong>{item.quantity}</strong></span>
                                {item.size && (
                                  <span className="size-pill">Size: {item.size}</span>
                                )}
                                <span>• Brand: {p?.brand || "SEEMZ"}</span>
                              </div>
                              <div className="meta-price">
                                <span>{formatPrice(p?.price || 0)} each</span>
                                <span className="subtotal font-mono">{formatPrice((p?.price || 0) * item.quantity)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="order-totals-summary">
                        <div className="summary-row">
                          <span>Items Subtotal</span>
                          <span className="font-mono">{formatPrice(selectedOrder.totalAmount)}</span>
                        </div>
                        <div className="summary-row">
                          <span>Bespoke Logistics</span>
                          <span className="free">FREE</span>
                        </div>
                        <div className="summary-row grand-total">
                          <span>GRAND TOTAL</span>
                          <span className="total-val font-mono">{formatPrice(selectedOrder.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS AREA */}
                  {selectedOrder.orderStatus !== "Cancelled" && (
                    <div className="modal-actions-area">
                      {selectedOrder.orderStatus !== "Delivered" && (
                        <button
                          onClick={() => handleDeliverOrder(selectedOrder._id)}
                          className="modal-btn-deliver-order"
                          disabled={actionLoading}
                        >
                          {actionLoading ? "Processing..." : "MARK AS DELIVERED"}
                        </button>
                      )}
                      <button
                        onClick={() => handleCancelOrder(selectedOrder._id)}
                        className="modal-btn-cancel-order"
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Processing..." : "CANCEL ORDER"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminOrders;
