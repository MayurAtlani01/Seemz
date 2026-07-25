import "./Men.css";
import { Link } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";


import heroVideo from "../../assets/videos/MenHero.mp4";

const categories = [
  {
    title: "SUITS",
    image:
  },
  {
    title: "SHIRTS",
    image: 
  },
  {
    title: "OUTERWEAR",
    image: 
  },
  {
    title: "FOOTWEAR",
    image: 
  },
];

const products = [
  {
    id: 1,
    name: "Tailored Wool Blazer",
    price: "₹8,999",
    image: blazer,
  },
  {
    id: 2,
    name: "Premium Cotton Shirt",
    price: "₹2,499",
    image: shirt,
  },
  {
    id: 3,
    name: "Minimal Bomber Jacket",
    price: "₹6,999",
    image: jacket,
  },
  {
    id: 4,
    name: "Leather Derby Shoes",
    price: "₹5,999",
    image: shoes,
  },
];

const Men = () => {
  return (
    <>
      <Navbar />

      {/* ================= HERO ================= */}

      <section className="men-hero">

        <video
          autoPlay
          muted
          loop
          playsInline
          className="men-video"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>

        <div className="men-overlay"></div>

        <div className="men-content">

          <p>SEEMZ MEN</p>

          <h1>
            Crafted For
            <br />
            Modern Gentlemen
          </h1>

          <span>
            Timeless silhouettes. Contemporary tailoring.
            Designed for confidence.
          </span>

          <Link to="/products" className="hero-btn">
            SHOP COLLECTION
          </Link>

        </div>

      </section>
            <section className="featured">

        <div className="section-title">

          <p>DISCOVER</p>

          <h2>Featured Collection</h2>

        </div>

        <div className="featured-grid">

          {categories.map((item, index) => (

            <div
              className="featured-card"
              key={index}
            >

              <img
                src={item.image}
                alt={item.title}
              />

              <div className="featured-overlay">

                <h3>{item.title}</h3>

                <Link to="/products">
                  Explore →
                </Link>

              </div>

            </div>

          ))}

        </div>

      </section>

            <section className="men-editorial">

        <div className="editorial-image">

          <img
            src={editorialImage}
            alt="Editorial"
          />

        </div>

        <div className="editorial-content">

          <p>EDITORIAL</p>

          <h2>
            Designed For Men
            <br />
            Who Never Follow Trends
          </h2>

          <span>
            Luxury isn't about chasing fashion.
            It's about creating a timeless identity.
          </span>

          <Link
            to="/products"
            className="editorial-btn"
          >
            SHOP NOW
          </Link>

        </div>

      </section>
      </>
  )}

  export default Men;