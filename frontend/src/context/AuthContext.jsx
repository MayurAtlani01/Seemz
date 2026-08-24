import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getProfile } from "../services/profileservices";
import { getWishlist, addToWishlist, removeFromWishlist } from "../services/wishlistservices";
import {
  getCart,
  addToCart as apiAddToCart,
  updateCart as apiUpdateCart,
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart,
} from "../services/cartservices";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Wishlist state
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Cart state
  const [cart, setCart] = useState({ items: [] });
  const [cartLoading, setCartLoading] = useState(false);

  // Fetch Wishlist for authenticated user
  const fetchUserWishlist = useCallback(async () => {
    try {
      setWishlistLoading(true);
      const data = await getWishlist();
      if (data?.success && data?.wishlist) {
        const products = Array.isArray(data.wishlist.products)
          ? data.wishlist.products
          : [];
        setWishlistItems(products);
        setWishlistIds(
          products.map((p) => (typeof p === "string" ? p : p._id || p.id))
        );
      } else {
        setWishlistIds([]);
        setWishlistItems([]);
      }
    } catch {
      setWishlistIds([]);
      setWishlistItems([]);
    } finally {
      setWishlistLoading(false);
    }
  }, []);

  // Fetch Cart for authenticated user
  const fetchUserCart = useCallback(async () => {
    try {
      setCartLoading(true);
      const data = await getCart();
      if (data?.success && data?.cart) {
        setCart(data.cart);
      } else {
        setCart({ items: [] });
      }
    } catch {
      setCart({ items: [] });
    } finally {
      setCartLoading(false);
    }
  }, []);

  // Fetch Current User
  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      if (data?.success && data?.user) {
        setUser(data.user);
        // User is authenticated -> load wishlist and cart
        fetchUserWishlist();
        fetchUserCart();
      } else {
        setUser(null);
        setWishlistIds([]);
        setWishlistItems([]);
        setCart({ items: [] });
      }
    } catch {
      setUser(null);
      setWishlistIds([]);
      setWishlistItems([]);
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  }, [fetchUserWishlist, fetchUserCart]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = (userData) => {
    setUser(userData);
    fetchUserWishlist();
    fetchUserCart();
  };

  const logout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      setUser(null);
      setWishlistIds([]);
      setWishlistItems([]);
      setCart({ items: [] });
    }
  };

  // Helper: check if a product ID is wishlisted
  const isProductWishlisted = useCallback(
    (productId) => {
      if (!productId) return false;
      const strId = String(productId);
      return wishlistIds.some((id) => String(id) === strId);
    },
    [wishlistIds]
  );

  // Toggle wishlist action
  const toggleWishlist = async (productId, productObject = null) => {
    if (!user) {
      return { success: false, requireLogin: true };
    }

    const strId = String(productId);
    const currentlyWishlisted = wishlistIds.some((id) => String(id) === strId);

    try {
      if (currentlyWishlisted) {
        // Optimistically remove
        setWishlistIds((prev) => prev.filter((id) => String(id) !== strId));
        setWishlistItems((prev) =>
          prev.filter((p) => String(p._id || p.id) !== strId)
        );

        await removeFromWishlist(productId);
        return { success: true, wishlisted: false };
      } else {
        // Optimistically add
        setWishlistIds((prev) => [...prev, productId]);
        if (productObject) {
          setWishlistItems((prev) => [...prev, productObject]);
        }

        await addToWishlist(productId);
        // Refresh to ensure full populated item
        fetchUserWishlist();
        return { success: true, wishlisted: true };
      }
    } catch (err) {
      console.error("Wishlist toggle error:", err);
      // Revert/refresh on error
      fetchUserWishlist();
      return { success: false, message: err.message };
    }
  };

  // Cart operations
  const addToCart = async (productId, quantity = 1, size = "") => {
    if (!user) {
      return { success: false, requireLogin: true };
    }
    try {
      const res = await apiAddToCart(productId, quantity, size);
      if (res?.success && res?.cart) {
        setCart(res.cart);
        return { success: true, message: res.message, cart: res.cart };
      }
      return { success: false, message: res?.message || "Failed to add to cart" };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to add to cart";
      return { success: false, message: msg };
    }
  };

  const updateCartQty = async (productId, quantity, size = "") => {
    if (!user) {
      return { success: false, requireLogin: true };
    }
    try {
      const res = await apiUpdateCart(productId, quantity, size);
      if (res?.success && res?.cart) {
        setCart(res.cart);
        return { success: true, cart: res.cart };
      }
      return { success: false, message: res?.message || "Failed to update cart" };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to update cart";
      return { success: false, message: msg };
    }
  };

  const removeItemFromCart = async (productId, size = "") => {
    if (!user) {
      return { success: false, requireLogin: true };
    }
    try {
      const res = await apiRemoveFromCart(productId, size);
      if (res?.success && res?.cart) {
        setCart(res.cart);
        return { success: true, cart: res.cart };
      }
      return { success: false, message: res?.message || "Failed to remove item" };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to remove item";
      return { success: false, message: msg };
    }
  };

  const clearUserCart = async () => {
    if (!user) return { success: false };
    try {
      const res = await apiClearCart();
      if (res?.success) {
        setCart({ items: [] });
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      console.error("Clear cart error:", err);
      return { success: false };
    }
  };

  const cartItems = Array.isArray(cart?.items) ? cart.items : [];
  const cartCount = cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);

  const isAdmin = user?.role === "admin";
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        loading,
        login,
        logout,
        refreshUser: fetchCurrentUser,
        // Wishlist
        wishlistIds,
        wishlistItems,
        wishlistLoading,
        fetchWishlist: fetchUserWishlist,
        isProductWishlisted,
        toggleWishlist,
        // Cart
        cart,
        cartItems,
        cartCount,
        cartLoading,
        fetchCart: fetchUserCart,
        addToCart,
        updateCartQty,
        removeFromCart: removeItemFromCart,
        clearCart: clearUserCart,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

