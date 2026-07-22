import "./Navbar.css";
import { NavLink, useLocation } from "react-router-dom";
import { Search, Heart, User, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu whenever route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

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
          <li><NavLink to="/products">MEN</NavLink></li>
          <li><NavLink to="/products">WOMEN</NavLink></li>
          <li><NavLink to="/products">NEW ARRIVALS</NavLink></li>
          <li><NavLink to="/about">ABOUT</NavLink></li>
        </ul>

        <div className="nav-icons">

          <button>
            <Search size={20} strokeWidth={1.7} />
          </button>

          <button>
            <Heart size={20} strokeWidth={1.7} />
          </button>

          <button>
            <User size={20} strokeWidth={1.7} />
          </button>

          <button
            className="menu-btn"
            onClick={() => setMenuOpen(prev => !prev)}
          >
            {menuOpen ? (
              <X size={24} strokeWidth={1.7} />
            ) : (
              <Menu size={24} strokeWidth={1.7} />
            )}
          </button>

        </div>

      </nav>

      <div className={`mobile-menu ${menuOpen ? "active" : ""}`}>
        <NavLink to="/">HOME</NavLink>
        <NavLink to="/products">MEN</NavLink>
        <NavLink to="/products">WOMEN</NavLink>
        <NavLink to="/products">NEW ARRIVALS</NavLink>
        <NavLink to="/about">ABOUT</NavLink>
      </div>

    </header>
  );
};

export default Navbar;