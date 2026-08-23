import "./Orders.css";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, ArrowLeft, ArrowRight, Clock, CheckCircle, Truck } from "lucide-react";
import { getMyOrders } from "../../services/orderservices";
import { useAuth } from "../../context/AuthContext";
import imgFallback from "../../assets/images/product1.jpg";

function Orders() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
          <p>Retrieving your order archives...</p>
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
          <span className="orders-eyebrow">NO PURCHASES YET</span>
          <h1>Order History</h1>
          <p>You have not placed any orders yet. Discover our curated collections today.</p>
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
        <span className="orders-eyebrow">PURCHASE ARCHIVES</span>
        <h1>My Orders</h1>
        <p>{orders.length} {orders.length === 1 ? "Verified Order" : "Verified Orders"}</p>
      </header>

      <div className="orders-container">
        <div className="orders-list-wrapper">
          {orders.map((ord) => (
            <div key={ord._id} className="order-item-card">
              <div className="order-card-header">
                <div>
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
                  {ord.orderStatus || "Confirmed"}
                </span>
              </div>

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
                        <h4>{p?.name || "SEEMZ Luxury Garment"}</h4>
                        <p className="order-product-sub">
                          Qty: {item.quantity} {p?.brand && `• ${p.brand}`}
                        </p>
                        <span className="order-product-price">
                          {formatPrice(p?.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="order-card-footer">
                <div className="order-payment-info">
                  <span>Payment: <strong>{ord.paymentMethod || "COD"}</strong></span>
                </div>

                <div className="order-total-info">
                  <span>Total Amount:</span>
                  <strong>{formatPrice(ord.totalAmount)}</strong>
                </div>
              </div>
            </div>
          ))}

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