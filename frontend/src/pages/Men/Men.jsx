import "./Men.css";
import { Link } from "react-router-dom";

import PrimaryButton from "../../components/PrimaryButton/PrimaryButton";
import ProductCard from "../../components/ProductCard/ProductCard";

import menHero from "../../assets/videos/Men.mp4";
import editorialImg from "../../assets/images/editorialImg.jpg";
import featuredImg from "../../assets/images/featuredImg.jpg";

import img1 from "../../assets/images/product1.jpg";
import img2 from "../../assets/images/product2.jpg";
import img3 from "../../assets/images/product3.jpg";
import img4 from "../../assets/images/product3.jpg";
import img5 from "../../assets/images/product2.jpg";
import img6 from "../../assets/images/product3.jpg";
import img7 from "../../assets/images/product1.jpg";
import img8 from "../../assets/images/product1.jpg";

const products = [
  {
    id: 1,
    image: img1,
    title: "Classic Black Shirt",
    category: "Shirts",
    price: "₹2,499",
  },
  {
    id: 2,
    image: img2,
    title: "Tailored Blazer",
    category: "Outerwear",
    price: "₹5,999",
  },
  {
    id: 3,
    image: img3,
    title: "Premium Tee",
    category: "T-Shirts",
    price: "₹1,499",
  },
  {
    id: 4,
    image: img4,
    title: "Relaxed Trousers",
    category: "Bottomwear",
    price: "₹2,999",
  },
  {
    id: 5,
    image: img5,
    title: "Oversized Hoodie",
    category: "Hoodies",
    price: "₹3,499",
  },
  {
    id: 6,
    image: img6,
    title: "Denim Jacket",
    category: "Jackets",
    price: "₹4,299",
  },
  {
    id: 7,
    image: img7,
    title: "Straight Fit Jeans",
    category: "Denim",
    price: "₹2,699",
  },
  {
    id: 8,
    image: img8,
    title: "Luxury Polo",
    category: "Polos",
    price: "₹2,199",
  },
];

const categories = [
  "Shirts",
  "T-Shirts",
  "Jackets",
  "Hoodies",
  "Jeans",
  "Trousers",
];

function Men() {
  return (<main className="men-page">

      {/* ================= HERO ================= */}

      <section className="men-hero">

        <video
          className="men-hero-video"
          src={menHero}
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="men-hero-overlay"></div>

        <div className="men-hero-content">

          <span className="men-hero-tag">
            MEN COLLECTION 2026
          </span>

          <h1>
            Crafted For
            <br />
            Modern Men
          </h1>

          <p>
            Minimal silhouettes.
            Premium fabrics.
            Timeless luxury.
          </p>

          <div className="men-hero-buttons">

            <PrimaryButton
              text="Shop Now"
              to="/products"
            />

            <Link
              to="/about"
              className="hero-link"
            >
              Discover More →
            </Link>

          </div>

        </div>

      </section>



      {/* ================= NEW ARRIVALS ================= */}

      <section className="section">

        <div className="section-heading">

          <div>

            <span>NEW SEASON</span>

            <h2>
              New Arrivals
            </h2>

          </div>

          <Link to="/products">
            View All →
          </Link>

        </div>



        <div className="product-grid">

          {products.map((product) => (

            <ProductCard
              key={product.id}
              id={product.id}
              image={product.image}
              title={product.title}
              category={product.category}
              price={product.price}
            />

          ))}

        </div>

      </section>
            {/* ================= EDITORIAL ================= */}

      <section className="men-editorial">

        <div className="editorial-image">

          <img
            src={editorialImg}
            alt="Editorial"
          />

        </div>

        <div className="editorial-content">

          <span>EDITORIAL</span>

          <h2>
            Designed To
            <br />
            Stand Apart
          </h2>

          <p>
            Contemporary tailoring meets timeless aesthetics.
            Every piece is crafted for men who appreciate
            understated luxury and refined simplicity.
          </p>

          <PrimaryButton
            text="Explore Collection"
            to="/products"
          />

        </div>

      </section>



      {/* ================= TRENDING NOW ================= */}

      <section className="section">

        <div className="section-heading">

          <div>

            <span>TRENDING</span>

            <h2>Trending Now</h2>

          </div>

          <Link to="/products">
            View All →
          </Link>

        </div>

        <div className="product-grid">

          {[...products].reverse().map((product) => (

            <ProductCard
              key={`trend-${product.id}`}
              id={product.id}
              image={product.image}
              title={product.title}
              category={product.category}
              price={product.price}
            />

          ))}

        </div>

      </section>



      {/* ================= FEATURED ================= */}

      <section className="featured-look">

        <img
          src={featuredImg}
          alt="Featured Collection"
        />

        <div className="featured-overlay">

          <span>FEATURED COLLECTION</span>

          <h2>
            Autumn
            <br />
            Essentials
          </h2>

          <p>
            Elevated everyday wear designed with premium
            fabrics and clean silhouettes.
          </p>

          <PrimaryButton
            text="Shop The Look"
            to="/products"
          />

        </div>

      </section>
            {/* BEST SELLERS */}

      <section className="section">

        <div className="section-heading">
          <div>
            <span>BEST SELLERS</span>
            <h2>Customer Favorites</h2>
          </div>

          <Link to="/products">
            View All →
          </Link>
        </div>

        <div className="product-grid">

          {products.map((product) => (
            <ProductCard
              key={`best-${product.id}`}
              id={product.id}
              image={product.image}
              title={product.title}
              category={product.category}
              price={product.price}
            />
          ))}

        </div>

      </section>

    </main>
  );
}

export default Men;