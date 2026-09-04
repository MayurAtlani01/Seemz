import "./Cart.css";
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Plus,
  Edit2,
  CheckCircle2,
  CreditCard,
  MapPin,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from "../../services/addressservices";
import { placeOrder } from "../../services/orderservices";
import imgFallback from "../../assets/images/product1.jpg";

function Cart() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    loading: authLoading,
    cart,
    cartLoading,
    updateCartQty,
    removeFromCart,
    clearCart,
    fetchCart,
  } = useAuth();

  // Checkout & step state
  const [isCheckout, setIsCheckout] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);

  // Address Modal/Form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [addressError, setAddressError] = useState("");

  // Order placement state
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);

  // Load addresses when entering checkout
  const fetchUserAddresses = useCallback(async () => {
    try {
      setAddressLoading(true);
      setAddressError("");
      const data = await getAddresses();
      if (data?.success && Array.isArray(data.addresses)) {
        setAddresses(data.addresses);
        if (data.addresses.length > 0) {
          // Select first address by default if none selected
          setSelectedAddressId((prev) =>
            prev && data.addresses.some((a) => a._id === prev)
              ? prev
              : data.addresses[0]._id
          );
        } else {
          setSelectedAddressId("");
        }
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setAddressError("Could not retrieve saved addresses.");
    } finally {
      setAddressLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      if (isCheckout) {
        fetchUserAddresses();
      }
    }
  }, [isAuthenticated, isCheckout, fetchCart, fetchUserAddresses]);

  const handleUpdateQty = async (productId, currentQty, delta, size, maxStock) => {
    const newQty = currentQty + delta;
    if (newQty < 1) {
      await removeFromCart(productId, size);
      return;
    }
    if (newQty > maxStock) {
      return;
    }
    await updateCartQty(productId, newQty, size);
  };

  const handleRemoveItem = async (productId, size) => {
    await removeFromCart(productId, size);
  };

  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `₹${price.toLocaleString("en-IN")}`;
    }
    return price || "";
  };

  // Open Add Address Form
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      fullName: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
    });
    setAddressError("");
    setShowAddressForm(true);
  };

  // Open Edit Address Form
  const handleOpenEditAddress = (addr) => {
    setEditingAddressId(addr._id);
    setAddressForm({
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      address: addr.address || "",
      city: addr.city || "",
      state: addr.state || "",
      country: addr.country || "India",
      pincode: addr.pincode || "",
    });
    setAddressError("");
    setShowAddressForm(true);
  };

  // Submit Address Form (Create or Update)
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setAddressError("");

    try {
      if (editingAddressId) {
        const res = await updateAddress(editingAddressId, addressForm);
        if (res?.success) {
          setShowAddressForm(false);
          await fetchUserAddresses();
        } else {
          setAddressError(res?.message || "Failed to update address.");
        }
      } else {
        const res = await addAddress(addressForm);
        if (res?.success && res.address) {
          setShowAddressForm(false);
          await fetchUserAddresses();
          setSelectedAddressId(res.address._id);
        } else {
          setAddressError(res?.message || "Failed to save address.");
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to process address.";
      setAddressError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this address?")) return;
    try {
      const res = await deleteAddress(id);
      if (res?.success) {
        await fetchUserAddresses();
      }
    } catch (err) {
      console.error("Delete address error:", err);
    }
  };

  // Place Order Action
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setOrderError("Please select or add a delivery address.");
      return;
    }

    try {
      setPlacingOrder(true);
      setOrderError("");
      const res = await placeOrder(selectedAddressId);
      if (res?.success && res.order) {
        setPlacedOrder(res.order);
        await clearCart();
      } else {
        setOrderError(res?.message || "Failed to place order. Please try again.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Could not process order.";
      setOrderError(msg);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!isAuthenticated && !authLoading) {
    return (
      <main className="cart-page">
        <div className="cart-auth-box">
          <div className="cart-icon-circle">
            <ShoppingBag size={36} strokeWidth={1.2} />
          </div>
          <span className="cart-eyebrow">SEEMZ</span>
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

  // If order was successfully placed, show confirmation screen
  if (placedOrder) {
    return (
      <main className="cart-page">
        <div className="order-success-card">
          <div className="success-icon-circle">
            <CheckCircle2 size={48} strokeWidth={1.2} />
          </div>
          <span className="cart-eyebrow">ORDER CONFIRMED</span>
          <h1>Thank You for Your Order</h1>
          <p className="order-success-lead">
            Your order has been placed successfully and is being prepared for shipping.
          </p>

          <div className="order-success-details">
            <div className="success-meta-row">
              <span>Order ID</span>
              <strong>#{placedOrder._id?.slice(-8).toUpperCase()}</strong>
            </div>
            <div className="success-meta-row">
              <span>Payment Method</span>
              <strong>{placedOrder.paymentMethod || "Cash on Delivery"}</strong>
            </div>
            <div className="success-meta-row">
              <span>Total Amount</span>
              <strong>{formatPrice(placedOrder.totalAmount)}</strong>
            </div>
            {placedOrder.address && (
              <div className="success-address-block">
                <span>Shipping Address:</span>
                <p>
                  {placedOrder.address.fullName}, {placedOrder.address.address},{" "}
                  {placedOrder.address.city}, {placedOrder.address.state} -{" "}
                  {placedOrder.address.pincode}
                </p>
                <p>Phone: {placedOrder.address.phone}</p>
              </div>
            )}
          </div>

          <div className="order-success-actions">
            <Link to="/orders" className="cart-btn-primary">
              View in My Orders <ArrowRight size={16} />
            </Link>
            <Link to="/products" className="cart-btn-secondary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const items = Array.isArray(cart?.items) ? cart.items : [];
  const subtotal = items.reduce((acc, item) => {
    const price = item.product?.price || 0;
    return acc + price * (item.quantity || 1);
  }, 0);

  const shipping = subtotal >= 2999 || subtotal === 0 ? 0 : 250;
  const total = subtotal + shipping;

  if (cartLoading && items.length === 0) {
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
          <p>Discover our latest collection of modern luxury essentials.</p>
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
        <span className="cart-eyebrow">
          {isCheckout ? "CHECKOUT" : "SEEMZ"}
        </span>
        <h1>{isCheckout ? "Checkout" : "Shopping Bag"}</h1>
        <p>
          {items.length} {items.length === 1 ? "item" : "items"} in your shopping bag
        </p>
      </header>

      <div className="cart-container">
        {/* Left Column: Bag Items or Checkout Steps */}
        <div className="cart-items-column">
          {!isCheckout ? (
            <>
              {items.map((item, idx) => {
                const product = item.product;
                if (!product) return null;
                const prodId = product._id || product.id;
                const img =
                  Array.isArray(product.images) && product.images.length > 0
                    ? product.images[0]
                    : product.image || imgFallback;
                const maxStock = product.stock || 0;

                return (
                  <div key={`${prodId}-${item.size || ""}-${idx}`} className="cart-item-card">
                    <Link to={`/products/${prodId}`} className="cart-item-image">
                      <img src={img} alt={product.name} />
                    </Link>

                    <div className="cart-item-info">
                      <div className="cart-item-top">
                        <span className="cart-item-brand">{product.brand || "SEEMZ"}</span>
                        <Link to={`/products/${prodId}`} className="cart-item-name">
                          {product.name}
                        </Link>
                        <div className="cart-item-meta-row">
                          <span className="cart-item-cat">
                            {product.subCategory || product.category || "Couture"}
                          </span>
                          {item.size && (
                            <span className="cart-item-size-badge">
                              SIZE: <strong>{item.size}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="cart-item-bottom">
                        <div className="cart-qty-control">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQty(prodId, item.quantity, -1, item.size, maxStock)
                            }
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQty(prodId, item.quantity, 1, item.size, maxStock)
                            }
                            disabled={item.quantity >= maxStock}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <div className="cart-price-column">
                          <span className="cart-unit-price">
                            {formatPrice(product.price)} each
                          </span>
                          <span className="cart-item-price">
                            {formatPrice(product.price * item.quantity)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="cart-item-delete"
                          onClick={() => handleRemoveItem(prodId, item.size)}
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
                  <ArrowLeft size={16} /> Continue Browsing Collections
                </Link>
              </div>
            </>
          ) : (
            /* CHECKOUT STEP VIEW */
            <div className="checkout-step-container">
              {/* Step 1: Select or Add Delivery Address */}
              <section className="checkout-section-box">
                <div className="checkout-section-header">
                  <div className="step-badge">1</div>
                  <div>
                    <h3>Delivery Destination</h3>
                    <p>Select or register a verified delivery location</p>
                  </div>
                  <button
                    type="button"
                    className="add-address-btn"
                    onClick={handleOpenAddAddress}
                  >
                    <Plus size={14} /> Add Address
                  </button>
                </div>

                {addressError && (
                  <div className="checkout-alert error">
                    <AlertCircle size={16} />
                    <span>{addressError}</span>
                  </div>
                )}

                {addressLoading ? (
                  <div className="address-loading-box">
                    <p>Loading saved addresses...</p>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="no-address-box">
                    <MapPin size={28} strokeWidth={1.2} />
                    <p>No delivery addresses found on your account.</p>
                    <button
                      type="button"
                      className="cart-btn-primary"
                      onClick={handleOpenAddAddress}
                    >
                      <Plus size={14} /> Add New Address
                    </button>
                  </div>
                ) : (
                  <div className="address-cards-grid">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr._id;
                      return (
                        <div
                          key={addr._id}
                          className={`address-card ${isSelected ? "selected" : ""}`}
                          onClick={() => setSelectedAddressId(addr._id)}
                        >
                          <div className="address-card-header">
                            <div className="address-radio-indicator">
                              {isSelected && <div className="radio-inner" />}
                            </div>
                            <span className="address-recipient-name">{addr.fullName}</span>
                            <div className="address-actions-inline">
                              <button
                                type="button"
                                className="addr-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditAddress(addr);
                                }}
                                title="Edit Address"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                className="addr-action-btn delete"
                                onClick={(e) => handleDeleteAddress(addr._id, e)}
                                title="Delete Address"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <div className="address-card-body">
                            <p className="addr-street">{addr.address}</p>
                            <p className="addr-city-pincode">
                              {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                            <p className="addr-country">{addr.country}</p>
                            <p className="addr-phone">Phone: {addr.phone}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Step 2: Payment Method */}
              <section className="checkout-section-box">
                <div className="checkout-section-header">
                  <div className="step-badge">2</div>
                  <div>
                    <h3>Payment Mode</h3>
                    <p>Secure payment on delivery</p>
                  </div>
                </div>

                <div className="payment-options-box">
                  <div className="payment-method-card active">
                    <div className="payment-method-radio">
                      <div className="radio-inner" />
                    </div>
                    <div className="payment-method-details">
                      <div className="payment-method-title">
                        <strong>Cash on Delivery (COD)</strong>
                        <span className="cod-badge">AVAILABLE</span>
                      </div>
                      <p>
                        Pay securely with cash or UPI when your order is delivered to your doorstep.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="cart-back-row">
                <button
                  type="button"
                  className="continue-link"
                  onClick={() => setIsCheckout(false)}
                >
                  <ArrowLeft size={16} /> Return to Bag Items
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary Card */}
        <aside className="cart-summary-card">
          <h3>Order Overview</h3>

          <div className="summary-row">
            <span>Subtotal ({items.length} {items.length === 1 ? "item" : "items"})</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <div className="summary-row">
            <span>Delivery</span>
            <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
          </div>

          <div className="summary-divider" />

          <div className="summary-row total-row">
            <span>Total Amount</span>
            <span>{formatPrice(total)}</span>
          </div>

          {orderError && (
            <div className="checkout-alert error" style={{ marginTop: "12px" }}>
              <AlertCircle size={16} />
              <span>{orderError}</span>
            </div>
          )}

          {!isCheckout ? (
            <button
              type="button"
              className="checkout-btn"
              onClick={() => {
                setIsCheckout(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Proceed to Checkout <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="checkout-btn place-order-btn"
              onClick={handlePlaceOrder}
              disabled={placingOrder || !selectedAddressId}
            >
              {placingOrder ? "Placing Order..." : "Place Order (Cash on Delivery)"}
            </button>
          )}

          <div className="cart-perks-box">
            <div className="perk-row">
              <Truck size={16} />
              <span>Free shipping on orders over ₹2,999</span>
            </div>
            <div className="perk-row">
              <ShieldCheck size={16} />
              <span>100% Authentic Products</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <div className="modal-backdrop" onClick={() => setShowAddressForm(false)}>
          <div
            className="address-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>{editingAddressId ? "Edit Delivery Address" : "Add Delivery Address"}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAddressForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddressSubmit} className="address-modal-form">
              {addressError && (
                <div className="checkout-alert error">
                  <AlertCircle size={16} />
                  <span>{addressError}</span>
                </div>
              )}

              <div className="form-row-2">
                <div className="form-field">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Recipient's Name"
                    value={addressForm.fullName}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={addressForm.phone}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Street Address / Apartment *</label>
                <input
                  type="text"
                  required
                  placeholder="House / Flat No., Building, Street Area"
                  value={addressForm.address}
                  onChange={(e) =>
                    setAddressForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                />
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label>City *</label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, city: e.target.value }))
                    }
                  />
                </div>

                <div className="form-field">
                  <label>State *</label>
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={addressForm.state}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, state: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label>Pincode / Postal Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="6-digit pincode"
                    value={addressForm.pincode}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, pincode: e.target.value }))
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Country *</label>
                  <input
                    type="text"
                    required
                    placeholder="Country"
                    value={addressForm.country}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, country: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cart-btn-secondary"
                  onClick={() => setShowAddressForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cart-btn-primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting
                    ? "Saving..."
                    : editingAddressId
                    ? "Update Address"
                    : "Save & Use Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Cart;