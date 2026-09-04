import "./Orders.css";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, ArrowLeft, ArrowRight, MapPin, CreditCard, Clock, ShieldCheck } from "lucide-react";
import { getMyOrders, cancelMyOrder } from "../../services/orderservices";
import { useAuth } from "../../context/AuthContext";
import imgFallback from "../../assets/images/product1.jpg";

function Orders() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoadingId, setCancelLoadingId] = useState(null);

  const handleCancelMyOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      setCancelLoadingId(orderId);
      const data = await cancelMyOrder(orderId);
      if (data?.success) {
        // Update local order status in list
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, orderStatus: "Cancelled" } : o))
        );
        alert("Your order has been cancelled.");
      }
    } catch (err) {
      console.error("Order self-cancellation failure:", err);
      alert(err.response?.data?.message || "Could not cancel your order. Please try again.");
    } finally {
      setCancelLoadingId(null);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getMyOrders();
        if (data?.success && Array.isArray(data?.orders)) {
          setOrders(data.orders);
        }
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `₹${price.toLocaleString("en-IN")}`;
    }
    return price || "";
  };

  if (loading) {
    return (
      <main className="orders-page">
        <div className="orders-loading-box">
          <p>Loading your orders...</p>
        </div>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="orders-page">
        <div className="orders-empty-box">
          <div className="orders-icon-circle">
            <Package size={40} strokeWidth={1} />
          </div>
          <span className="orders-eyebrow">NO ORDERS YET</span>
          <h1>Order History</h1>
          <p>You have not placed any orders yet. Discover our latest collections today.</p>
          <Link to="/products" className="orders-btn-primary">
            Explore Collections <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <header className="orders-header">
        <span className="orders-eyebrow">ORDER HISTORY</span>
        <h1>My Orders</h1>
        <p>{orders.length} {orders.length === 1 ? "Order" : "Orders"}</p>
      </header>

      <div className="orders-container">
        <div className="orders-list-wrapper">
          {orders.map((ord) => {
            const addr = ord.address;

            return (
              <div key={ord._id} className="order-item-card">
                {/* Order Top Bar */}
                <div className="order-card-header">
                  <div className="order-header-meta">
                    <span className="order-ref">ORDER #{ord._id.slice(-8).toUpperCase()}</span>
                    <span className="order-timestamp">
                      Placed on {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <span className={`order-status-badge ${ord.orderStatus?.toLowerCase()}`}>
                    {ord.orderStatus || "Pending"}
                  </span>
                </div>

                {/* Ordered Products List */}
                <div className="order-products-grid">
                  {ord.items?.map((item, idx) => {
                    const p = item.product;
                    const img =
                      Array.isArray(p?.images) && p?.images.length > 0
                        ? p.images[0]
                        : p?.image || imgFallback;

                    return (
                      <div key={idx} className="order-product-row">
                        <div className="order-product-thumb">
                          <img src={img} alt={p?.name || "Garment"} />
                        </div>

                        <div className="order-product-meta">
                          <div className="order-product-title-row">
                            <h4>{p?.name || "SEEMZ Luxury Garment"}</h4>
                            <span className="order-product-price">
                              {formatPrice((p?.price || 0) * item.quantity)}
                            </span>
                          </div>

                          <div className="order-product-sub-row">
                            <span className="order-qty-tag">Quantity: <strong>{item.quantity}</strong></span>
                            {item.size && (
                              <span className="order-size-tag">
                                Size: <strong>{item.size}</strong>
                              </span>
                            )}
                            {p?.brand && <span className="order-brand-tag">• {p.brand}</span>}
                            {p?.price && (
                              <span className="order-unit-price-tag">
                                ({formatPrice(p.price)} each)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Delivery Address & Summary Grid */}
                <div className="order-card-middle">
                  {addr && (
                    <div className="order-address-box">
                      <div className="order-section-title">
                        <MapPin size={14} />
                        <span>Delivery Destination</span>
                      </div>
                      <p className="order-addr-name">{addr.fullName}</p>
                      <p className="order-addr-line">{addr.address}</p>
                      <p className="order-addr-city">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="order-addr-country">{addr.country}</p>
                      <p className="order-addr-phone">Phone: {addr.phone}</p>
                    </div>
                  )}

                  <div className="order-summary-box">
                    <div className="order-section-title">
                      <CreditCard size={14} />
                      <span>Payment & Status</span>
                    </div>
                    <div className="order-detail-row">
                      <span>Payment Mode:</span>
                      <strong>{ord.paymentMethod || "Cash on Delivery (COD)"}</strong>
                    </div>
                    <div className="order-detail-row">
                      <span>Order Status:</span>
                      <strong>{ord.orderStatus || "Processing"}</strong>
                    </div>
                    <div className="order-detail-row">
                      <span>Shipping:</span>
                      <strong>Free</strong>
                    </div>
                  </div>
                </div>

                {/* Card Footer with Total */}
                <div className="order-card-footer">
                  <div className="order-guarantee-note">
                    <ShieldCheck size={14} />
                    <span>SEEMZ Authenticity Guaranteed</span>
                  </div>

                  <div className="order-footer-actions">
                    {["Pending", "Confirmed"].includes(ord.orderStatus) && (
                      <button
                        type="button"
                        onClick={() => handleCancelMyOrder(ord._id)}
                        className="order-cancel-btn"
                        disabled={cancelLoadingId === ord._id}
                      >
                        {cancelLoadingId === ord._id ? "Cancelling..." : "Cancel Order"}
                      </button>
                    )}
                    <div className="order-total-info">
                      <span>Total:</span>
                      <strong>{formatPrice(ord.totalAmount)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="orders-back-row">
            <Link to="/products" className="orders-back-link">
              <ArrowLeft size={16} /> Continue Browsing Collections
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Orders;