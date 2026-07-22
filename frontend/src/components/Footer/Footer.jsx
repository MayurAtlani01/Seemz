import "./Footer.css";
import { NavLink } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer">

      <div className="footer-top">

        {/* Brand */}

        <div className="footer-brand">
          <h1>SEEMZ</h1>
          <p>
            Crafted for those who embrace timeless elegance.
          </p>
        </div>

        {/* Links */}

        <div className="footer-links">

          <div className="footer-column">
            <h4>SHOP</h4>

            <NavLink to="/new-arrivals">New Arrivals</NavLink>
            <NavLink to="/men">Men</NavLink>
            <NavLink to="/women">Women</NavLink>
          </div>

          <div className="footer-column">
            <h4>COMPANY</h4>

            <NavLink to="/about">About</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            <NavLink to="/privacy">Privacy Policy</NavLink>
          </div>

          <div className="footer-column">
            <h4>CONNECT</h4>

            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>

            <a
              href="https://x.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              X
            </a>

            <a
              href="https://in.pinterest.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pinterest
            </a>
          </div>

        </div>

      </div>

      <div className="footer-bottom">
        <p>© 2026 SEEMZ. ALL RIGHTS RESERVED.</p>
      </div>

    </footer>
  );
};

export default Footer;