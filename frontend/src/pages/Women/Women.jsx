import "./Women.css";
import { Link } from "react-router-dom";

import PrimaryButton from "../../components/PrimaryButton/PrimaryButton";
import ProductCard from "../../components/ProductCard/ProductCard";

import womenHero from "../../assets/videos/Women.mp4";
import editorialImg from "../../assets/images/women/womenEditorial.jpg";
import featuredImg from "../../assets/images/women/womenFeatured2.jpg";

import img1 from "../../assets/images/women/women1.jpg";
import img2 from "../../assets/images/women/women2.jpg";
import img3 from "../../assets/images/women/women3.jpg";
import img4 from "../../assets/images/women/women4.jpg";
import img5 from "../../assets/images/women/women5.jpg";
import img6 from "../../assets/images/women/women6.jpg";
import img7 from "../../assets/images/women/women7.jpg";
import img8 from "../../assets/images/women/women8.jpg";

const products = [
  {
    id: 1,
    image: img1,
    title: "Silk Evening Dress",
    category: "Dresses",
    price: "₹4,999",
  },
  {
    id: 2,
    image: img2,
    title: "Oversized Blazer",
    category: "Outerwear",
    price: "₹5,499",
  },
  {
    id: 3,
    image: img3,
    title: "Satin Blouse",
    category: "Tops",
    price: "₹2,499",
  },
  {
    id: 4,
    image: img4,
    title: "Pleated Trousers",
    category: "Bottomwear",
    price: "₹3,299",
  },
  {
    id: 5,
    image: img5,
    title: "Luxury Handbag",
    category: "Accessories",
    price: "₹6,999",
  },
  {
    id: 6,
    image: img6,
    title: "Leather Heels",
    category: "Footwear",
    price: "₹4,499",
  },
  {
    id: 7,
    image: img7,
    title: "Cashmere Knit",
    category: "Knitwear",
    price: "₹3,799",
  },
  {
    id: 8,
    image: img8,
    title: "Minimal Gold Necklace",
    category: "Jewellery",
    price: "₹2,999",
  },
];

function Women() {
  return (
    <main className="women-page">

      {/* HERO */}

      <section className="women-hero">

        <video
          className="women-hero-video"
          src={womenHero}
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="women-hero-overlay"></div>

        <div className="women-hero-content">

          <span className="women-hero-tag">
            WOMEN COLLECTION 2026
          </span>

          <h1>
            Elegance
            <br />
            In Motion
          </h1>

          <p>
            Timeless silhouettes.
            Modern femininity.
            Effortless luxury.
          </p>

          <div className="women-hero-buttons">

            <PrimaryButton
              text="Shop Now"
              to="/products"
            />

            <Link
              to="/about"
              className="women-hero-link"
            >
              Discover More →
            </Link>

          </div>

        </div>

      </section>

      {/* NEW ARRIVALS */}

      <section className="women-section">

        <div className="women-section-heading">

          <div>
            <span>NEW SEASON</span>
            <h2>New Arrivals</h2>
          </div>

          <Link to="women">
            View All →
          </Link>

        </div>

        <div className="women-product-grid">

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

      {/* EDITORIAL */}

      <section className="women-editorial">

        <div className="women-editorial-image">

          <img
            src={editorialImg}
            alt="Editorial"
          />

        </div>

        <div className="women-editorial-content">

          <span>EDITORIAL</span>

          <h2>
            Crafted For
            <br />
            Confident Women
          </h2>

          <p>
            Elegant tailoring meets contemporary design.
            Every collection is created for women who embrace
            confidence, individuality and timeless style.
          </p>

          <PrimaryButton
            text="Explore Collection"
            to="/products"
          />

        </div>

      </section>

      {/* TRENDING */}

      <section className="women-section">

        <div className="women-section-heading">

          <div>
            <span>TRENDING</span>
            <h2>Trending Now</h2>
          </div>

          <Link to="/products">
            View All →
          </Link>

        </div>

        <div className="women-product-grid">

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

      {/* FEATURED */}

      <section className="women-featured">

        <img
          src={featuredImg}
          alt="Featured Collection"
        />

        <div className="women-featured-overlay">

          <span>FEATURED COLLECTION</span>

          <h2>
            The
            <br />
            Signature
            <br />
            Collection
          </h2>

          <p>
            Luxury essentials designed to elevate
            every wardrobe with effortless elegance.
          </p>

          <PrimaryButton
            text="Shop The Look"
            to="/products"
          />

        </div>

      </section>

      {/* EDITOR'S PICKS */}

      <section className="women-section">

        <div className="women-section-heading">

          <div>
            <span>EDITOR'S PICKS</span>
            <h2>Our Favorites</h2>
          </div>

          <Link to="/products">
            View All →
          </Link>

        </div>

        <div className="women-product-grid">

          {products.map((product) => (

            <ProductCard
              key={`editor-${product.id}`}
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

export default Women;