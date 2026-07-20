import "./Navbar.css";
import { NavLink } from "react-router-dom";
import { Search, Heart, User, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
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
            <li><NavLink to="/men">MEN</NavLink></li>
            <li><NavLink to="/women">WOMEN</NavLink></li>
            <li><NavLink to="/new-arrivals">NEW ARRIVALS</NavLink></li>
            <li><NavLink to="/about">ABOUT</NavLink></li>
          </ul>

          <div className="nav-icons">

            <button>
              <Search size={20} strokeWidth={1.7}/>
            </button>

            <button>
              <Heart size={20} strokeWidth={1.7}/>
            </button>

            <button>
              <User size={20} strokeWidth={1.7}/>
            </button>

            <button
              className="menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <X size={24} strokeWidth={1.7}/>
              ) : (
                <Menu size={24} strokeWidth={1.7}/>
              )}
            </button>

          </div>

        </nav>

      </header>

      <div className={`mobile-menu ${menuOpen ? "active" : ""}`}>
        <NavLink to="/" onClick={() => setMenuOpen(false)}>HOME</NavLink>
        <NavLink to="/men" onClick={() => setMenuOpen(false)}>MEN</NavLink>
        <NavLink to="/women" onClick={() => setMenuOpen(false)}>WOMEN</NavLink>
        <NavLink to="/new-arrivals" onClick={() => setMenuOpen(false)}>NEW ARRIVALS</NavLink>
        <NavLink to="/about" onClick={() => setMenuOpen(false)}>ABOUT</NavLink>
      </div>
    </>
  );
};

export default Navbar;