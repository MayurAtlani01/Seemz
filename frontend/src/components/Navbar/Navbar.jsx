import "./Navbar.css";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Search, Heart, User, Menu, X, LogOut, Shield, ChevronDown } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { user, isAuthenticated, isAdmin, logout, wishlistItems } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

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

  // Click outside to close dropdown
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

  return (
    <header className="header">
      <div className="announcement-bar">
        <p>NEW COLLECTION • FREE SHIPPING ABOVE ₹2999</p>
      </div>

      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="logo">
          <NavLink to="/">SEEMZ</NavLink>
        </div>

        <ul className="nav-links">
          <li><NavLink to="/">HOME</NavLink></li>
          <li><NavLink to="/products">COLLECTIONS</NavLink></li>
          <li><NavLink to="/men">MEN</NavLink></li>
          <li><NavLink to="/women">WOMEN</NavLink></li>
          <li><NavLink to="/new">NEW ARRIVALS</NavLink></li>
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

                  <NavLink to="/wishlist" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <Heart size={15} /> My Wishlist ({wishlistItems.length})
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

          <button
            className="menu-btn"
            aria-label="Toggle navigation menu"
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

      <div
        className={`mobile-menu-backdrop ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      <div className={`mobile-menu ${menuOpen ? "active" : ""}`}>
        <div className="mobile-menu-brand">
          <span>SEEMZ LUXURY</span>
          {isAuthenticated && (
            <p className="mobile-welcome-user">Welcome, {user?.name}</p>
          )}
        </div>

        <NavLink to="/">HOME</NavLink>
        <NavLink to="/products">ALL COLLECTIONS</NavLink>
        <NavLink to="/men">MEN</NavLink>
        <NavLink to="/women">WOMEN</NavLink>
        <NavLink to="/new">NEW ARRIVALS</NavLink>
        <NavLink to="/about">ABOUT</NavLink>

        <div className="mobile-menu-divider" />

        <NavLink to="/wishlist">MY WISHLIST ({wishlistItems.length})</NavLink>

        {isAuthenticated ? (
          <>
            <NavLink to="/profile">MY ACCOUNT</NavLink>
            {isAdmin && (
              <NavLink to="/admin/products" className="mobile-admin-link">
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
            <NavLink to="/login" className="mobile-login-highlight">
              SIGN IN
            </NavLink>
            <NavLink to="/register">CREATE ACCOUNT</NavLink>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;