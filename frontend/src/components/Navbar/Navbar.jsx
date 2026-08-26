import "./Navbar.css";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, User, Menu, X, LogOut, Shield, Package } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { user, isAuthenticated, isAdmin, logout, wishlistItems, cartCount } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Scroll listener for sticky navbar background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu & dropdown whenever route changes
  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [menuOpen]);

  // Press Escape to close menu & dropdown
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close desktop dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="announcement-bar">
        <p>NEW COLLECTION • FREE SHIPPING ABOVE ₹2999</p>
      </div>

      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="logo">
          <NavLink to="/" onClick={closeMenu}>SEEMZ</NavLink>
        </div>

        <ul className="nav-links">
          <li><NavLink to="/">HOME</NavLink></li>
          <li><NavLink to="/products">COLLECTIONS</NavLink></li>
          <li><NavLink to="/men">MEN</NavLink></li>
          <li><NavLink to="/women">WOMEN</NavLink></li>
          <li><NavLink to="/new">NEW ARRIVALS</NavLink></li>
          <li>
            <NavLink to="/changing-room" className="nav-changing-room-link">
              <span>CHANGING ROOM</span>
              <span className="exclusive-badge">EXCLUSIVE</span>
            </NavLink>
          </li>
          <li><NavLink to="/about">ABOUT</NavLink></li>
        </ul>

        <div className="nav-icons">
          <NavLink to="/products" className="nav-icon-btn" aria-label="Search Products">
            <Search size={20} strokeWidth={1.7} />
          </NavLink>

          <NavLink to="/wishlist" className="nav-icon-btn wishlist-nav-link" aria-label="Wishlist">
            <Heart size={20} strokeWidth={1.7} />
            {wishlistItems.length > 0 && (
              <span className="navbar-badge">{wishlistItems.length}</span>
            )}
          </NavLink>

          <NavLink to="/cart" className="nav-icon-btn cart-nav-link" aria-label="Shopping Bag">
            <ShoppingBag size={20} strokeWidth={1.7} />
            {cartCount > 0 && (
              <span className="navbar-badge">{cartCount}</span>
            )}
          </NavLink>

          {/* User Account Button / Dropdown */}
          <div className="user-dropdown-wrapper" ref={dropdownRef}>
            {isAuthenticated ? (
              <button
                type="button"
                className="nav-icon-btn user-btn active"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-label="User menu"
              >
                <User size={20} strokeWidth={1.7} />
                <span className="user-initial-dot" />
              </button>
            ) : (
              <NavLink to="/login" className="nav-login-link" aria-label="Login">
                <User size={18} strokeWidth={1.7} />
                <span className="login-text">LOGIN</span>
              </NavLink>
            )}

            {/* Desktop User Dropdown */}
            {isAuthenticated && dropdownOpen && (
              <div className="user-dropdown-menu">
                <div className="user-dropdown-header">
                  <span className="dropdown-name">{user.name}</span>
                  <span className="dropdown-email">{user.email}</span>
                  {isAdmin && <span className="dropdown-admin-tag">ADMIN</span>}
                </div>

                <div className="dropdown-links">
                  <NavLink to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <User size={15} /> My Profile
                  </NavLink>

                  <NavLink to="/orders" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <Package size={15} /> My Orders
                  </NavLink>

                  <NavLink to="/wishlist" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <Heart size={15} /> My Wishlist ({wishlistItems.length})
                  </NavLink>

                  <NavLink to="/cart" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <ShoppingBag size={15} /> Shopping Bag ({cartCount})
                  </NavLink>

                  {isAdmin && (
                    <NavLink to="/admin/products" className="dropdown-item admin-link" onClick={() => setDropdownOpen(false)}>
                      <Shield size={15} /> Admin Products
                    </NavLink>
                  )}

                  <button type="button" className="dropdown-item logout-item" onClick={handleLogout}>
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hamburger Menu Toggle Button */}
          <button
            type="button"
            className="menu-btn"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? (
              <X size={24} strokeWidth={1.7} />
            ) : (
              <Menu size={24} strokeWidth={1.7} />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`mobile-menu-backdrop ${menuOpen ? "active" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Mobile Navigation Drawer */}
      <aside
        className={`mobile-menu ${menuOpen ? "active" : ""}`}
        aria-label="Mobile Navigation"
      >
        <div className="mobile-menu-top-bar">
          <div className="mobile-menu-brand">
            <span>SEEMZ ATELIER</span>
            {isAuthenticated && (
              <p className="mobile-welcome-user">Client: {user?.name}</p>
            )}
          </div>
          <button
            type="button"
            className="mobile-close-btn"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        <nav className="mobile-nav-list">
          <NavLink to="/" onClick={closeMenu}>HOME</NavLink>
          <NavLink to="/men" onClick={closeMenu}>MEN</NavLink>
          <NavLink to="/women" onClick={closeMenu}>WOMEN</NavLink>
          <NavLink to="/new" onClick={closeMenu}>NEW ARRIVALS</NavLink>
          <NavLink to="/changing-room" onClick={closeMenu} className="mobile-changing-room-link">
            <span>CHANGING ROOM</span>
            <span className="exclusive-badge">EXCLUSIVE</span>
          </NavLink>
          <NavLink to="/products" onClick={closeMenu}>COLLECTIONS</NavLink>
          <NavLink to="/about" onClick={closeMenu}>ABOUT</NavLink>

          <div className="mobile-menu-divider" />

          <NavLink to="/wishlist" onClick={closeMenu} className="mobile-flex-link">
            <span>MY WISHLIST</span>
            {wishlistItems.length > 0 && (
              <span className="mobile-count-pill">{wishlistItems.length}</span>
            )}
          </NavLink>

          <NavLink to="/cart" onClick={closeMenu} className="mobile-flex-link">
            <span>SHOPPING BAG</span>
            {cartCount > 0 && (
              <span className="mobile-count-pill">{cartCount}</span>
            )}
          </NavLink>

          <div className="mobile-menu-divider" />

          {isAuthenticated ? (
            <>
              <NavLink to="/orders" onClick={closeMenu}>MY ORDERS</NavLink>
              <NavLink to="/profile" onClick={closeMenu}>MY ACCOUNT</NavLink>
              {isAdmin && (
                <NavLink to="/admin/products" onClick={closeMenu} className="mobile-admin-link">
                  ADMIN PRODUCT PANEL
                </NavLink>
              )}
              <button
                type="button"
                className="mobile-logout-btn"
                onClick={handleLogout}
              >
                SIGN OUT
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={closeMenu} className="mobile-login-highlight">
                SIGN IN
              </NavLink>
              <NavLink to="/register" onClick={closeMenu}>
                CREATE ACCOUNT
              </NavLink>
            </>
          )}
        </nav>
      </aside>
    </header>
  );
};

export default Navbar;