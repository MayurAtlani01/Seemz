import "./Home.css";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, ShoppingBag } from "lucide-react";

import heroVideo from "../../assets/videos/Home2.mp4";
import MenVideo from "../../assets/videos/Men.mp4";
import WomenVideo from "../../assets/videos/Women.mp4";
import Acc from "../../assets/videos/Acc.mp4";
import product1 from "../../assets/images/product1.jpg"
import product2 from "../../assets/images/product2.jpg"
import product3 from "../../assets/images/product3.jpg"
import product4 from "../../assets/images/product4.jpg"

const newArrivals = [
  {
    id: 1,
    name: "Oversized Wool Coat",
    price: "₹8,999",
    image: product1,
  },
  {
    id: 2,
    name: "Classic Black Blazer",
    price: "₹6,499",
    image:product2,
  },
  {
    id: 3,
    name: "Minimal Shirt",
    price: "₹2,999",
    image:product3,
  },
  {
    id: 4,
    name: "Premium Denim",
    price: "₹4,299",
    image: product4,
  },
];

const categories = [
  {
    title: "Men",
    video: MenVideo,
  },
  {
    title: "Women",
    video: WomenVideo,
  },
  {
    title: "Accessories",
    video: Acc,
  },
];

function Home() {
  return (
    <main className="home">

      {/* ================= HERO ================= */}

      <section className="hero">

        <video
          className="hero-video"
          src={heroVideo}
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="hero-content">

          <p className="hero-tag">
            LUXURY • MINIMAL • MODERN
          </p>

          <h1>
            Crafted
            <br />
            For
            <br />
            The Bold
          </h1>

          <p className="hero-text">
            Timeless silhouettes inspired by modern luxury.
          </p>

          <div className="hero-buttons">

            <button className="primary-btn">
              Shop Collection
            </button>

          </div>

        </div>

      </section>

      {/* ================= NEW ARRIVALS ================= */}

      <section className="section">

        <div className="section-heading">

          <div>
            <p>Latest Collection</p>
            <h2>New Arrivals</h2>
          </div>

          <Link to="/products">
            View All
            <ArrowRight size={18} />
          </Link>

        </div>

        <div className="product-grid">

          {newArrivals.map((item) => (

            <div className="product-card" key={item.id}>

              <div className="product-image">

                <img
                  src={item.image}
                  alt={item.name}
                />

                <button>
                  <Heart size={18} />
                </button>

              </div>

              <div className="product-info">

                <h3>{item.name}</h3>

                <p>{item.price}</p>

              </div>

            </div>

          ))}

        </div>

      </section>
            {/* ================= EDITORIAL ================= */}

      <section className="editorial">

        <div className="editorial-left">

          <img
            src="/images/editorial.jpg"
            alt="Editorial Collection"
          />

        </div>

        <div className="editorial-right">

          <p>Editorial Collection</p>

          <h2>
            Autumn
            <br />
            Essentials
          </h2>

          <span>
            Clean lines.
            Premium fabrics.
            Timeless confidence.
          </span>

          <Link to="/products">
            Explore Collection
          </Link>

        </div>

      </section>

      {/* ================= CATEGORIES ================= */}

      <section className="section">

        <div className="section-heading">

          <div>
            <p>Browse</p>
            <h2>Categories</h2>
          </div>

        </div>

        <div className="category-grid">

          {categories.map((item, index) => (

            <div className="category-card" key={index}>

              <video
                className="category-video"
                src={item.video}
                autoPlay
                muted
                loop
                playsInline
              />

              <div className="category-overlay">

                <h3>{item.title}</h3>

              </div>

            </div>

          ))}

        </div>

      </section>

      {/* ================= BRAND STORY ================= */}

      <section className="brand-story">

        <p>SEEMZ</p>

        <h2>
          Luxury isn't loud.
          <br />
          It's remembered.
        </h2>

        <span>
          We believe great fashion doesn't chase trends.
          It creates identity.
          Every piece is crafted for confidence,
          simplicity and timeless elegance.
        </span>

      </section>

      {/* ================= NEWSLETTER ================= */}

      <section className="newsletter">

        <h2>
          Join The Community
        </h2>

        <p>
          Receive exclusive launches and limited collections.
        </p>

        <form>

          <input
            type="email"
            placeholder="Enter your email"
          />

          <button>

            Subscribe

            <ShoppingBag size={18} />

          </button>

        </form>

      </section>

    </main>
  );
}

export default Home;