import "./Cart.css";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft, ShieldCheck, Truck } from "lucide-react";
import { getCart, updateCart, removeFromCart, clearCart } from "../../services/cartservices";
import { useAuth } from "../../context/AuthContext";
import imgFallback from "../../assets/images/product1.jpg";

function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCart();
      if (data?.success && data?.cart) {
        setCart(data.cart);
      } else {
        setCart({ items: [] });
      }
    } catch {
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserCart();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const handleUpdateQty = async (productId, newQty) => {
    if (newQty < 1) {
      handleRemoveItem(productId);
      return;
    }
    try {
      const res = await updateCart(productId, newQty);
      if (res?.success) {
        setCart(res.cart);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      const res = await removeFromCart(productId);
      if (res?.success) {
        setCart(res.cart);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `₹${price.toLocaleString("en-IN")}`;
    }
    return price || "";
  };

  if (!isAuthenticated && !authLoading) {
    return (
      <main className="cart-page">
        <div className="cart-auth-box">
          <div className="cart-icon-circle">
            <ShoppingBag size={36} strokeWidth={1.2} />
          </div>
          <span className="cart-eyebrow">SEEMZ ATELIER</span>
          <h1>Your Shopping Bag</h1>
          <p>Sign in to view your bag, access saved items, and proceed to checkout.</p>
          <div className="cart-auth-actions">
            <Link to="/login" className="cart-btn-primary">
              Sign In to Continue
            </Link>
            <Link to="/products" className="cart-btn-secondary">
              Explore Collection
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const items = cart?.items || [];
  const subtotal = items.reduce((acc, item) => {
    const price = item.product?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  const shipping = subtotal >= 2999 || subtotal === 0 ? 0 : 250;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <main className="cart-page">
        <div className="cart-loading-box">
          <p>Loading your shopping bag...</p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="cart-page">
        <div className="cart-empty-box">
          <div className="cart-icon-circle">
            <ShoppingBag size={40} strokeWidth={1} />
          </div>
          <span className="cart-eyebrow">YOUR BAG IS EMPTY</span>
          <h1>No Items In Your Bag</h1>
          <p>Discover our latest collection of contemporary luxury silhouettes.</p>
          <Link to="/products" className="cart-btn-primary">
            Start Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <header className="cart-header">
        <span className="cart-eyebrow">SEEMZ CHECKOUT</span>
        <h1>Shopping Bag</h1>
        <p>{items.length} {items.length === 1 ? "Item" : "Items"} in your selection</p>
      </header>

      <div className="cart-container">
        {/* Items List */}
        <div className="cart-items-column">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;
            const prodId = product._id || product.id;
            const img =
              Array.isArray(product.images) && product.images.length > 0
                ? product.images[0]
                : product.image || imgFallback;

            return (
              <div key={prodId} className="cart-item-card">
                <Link to={`/products/${prodId}`} className="cart-item-image">
                  <img src={img} alt={product.name} />
                </Link>

                <div className="cart-item-info">
                  <div className="cart-item-top">
                    <span className="cart-item-brand">{product.brand || "SEEMZ"}</span>
                    <Link to={`/products/${prodId}`} className="cart-item-name">
                      {product.name}
                    </Link>
                    <span className="cart-item-cat">
                      {product.subCategory || product.category || "Collection"}
                    </span>
                  </div>

                  <div className="cart-item-bottom">
                    <div className="cart-qty-control">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(prodId, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(prodId, item.quantity + 1)}
                        disabled={item.quantity >= (product.stock || 99)}
                      >
                        +
                      </button>
                    </div>

                    <span className="cart-item-price">
                      {formatPrice(product.price * item.quantity)}
                    </span>

                    <button
                      type="button"
                      className="cart-item-delete"
                      onClick={() => handleRemoveItem(prodId)}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="cart-back-row">
            <Link to="/products" className="continue-link">
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary Column */}
        <aside className="cart-summary-card">
          <h3>Order Summary</h3>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <div className="summary-row">
            <span>Estimated Shipping</span>
            <span>{shipping === 0 ? "Complimentary" : formatPrice(shipping)}</span>
          </div>

          <div className="summary-divider" />

          <div className="summary-row total-row">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          <button
            type="button"
            className="checkout-btn"
            onClick={() => alert("Checkout integration initialized. Contact concierge for instant order placement.")}
          >
            Proceed to Checkout
          </button>

          <div className="cart-perks-box">
            <div className="perk-row">
              <Truck size={16} />
              <span>Complimentary shipping on orders above ₹2,999</span>
            </div>
            <div className="perk-row">
              <ShieldCheck size={16} />
              <span>100% Secure & encrypted checkout</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default Cart;