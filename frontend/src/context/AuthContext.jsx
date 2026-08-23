import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getProfile } from "../services/profileservices";
import { getWishlist, addToWishlist, removeFromWishlist } from "../services/wishlistservices";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

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

  // Fetch Current User
  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      if (data?.success && data?.user) {
        setUser(data.user);
        // User is authenticated -> load wishlist
        fetchUserWishlist();
      } else {
        setUser(null);
        setWishlistIds([]);
        setWishlistItems([]);
      }
    } catch {
      setUser(null);
      setWishlistIds([]);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  }, [fetchUserWishlist]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = (userData) => {
    setUser(userData);
    fetchUserWishlist();
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
        wishlistIds,
        wishlistItems,
        wishlistLoading,
        fetchWishlist: fetchUserWishlist,
        isProductWishlisted,
        toggleWishlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
