import "./NewArrivals.css";
import { Link } from "react-router-dom";

import PrimaryButton from "../../components/PrimaryButton/PrimaryButton";
import ProductCard from "../../components/ProductCard/ProductCard";

import hero from "../../assets/images/new-arrivals/hero.jpg";
import editorial from "../../assets/images/new-arrivals/editorial.jpg";

import img1 from "../../assets/images/new-arrivals/new1.jpg";
import img2 from "../../assets/images/new-arrivals/new2.jpg";
import img3 from "../../assets/images/new-arrivals/new3.jpg";
import img4 from "../../assets/images/new-arrivals/new4.jpg";
import img5 from "../../assets/images/new-arrivals/new5.jpg";
import img6 from "../../assets/images/new-arrivals/new6.jpg";
import img7 from "../../assets/images/new-arrivals/new7.jpg";
import img8 from "../../assets/images/new-arrivals/new8.jpg";

const products = [
  {
    id: 1,
    image: img1,
    title: "Tailored Wool Blazer",
    category: "Outerwear",
    price: "₹8,499",
  },
  {
    id: 2,
    image: img2,
    title: "Oversized Cotton Shirt",
    category: "Shirts",
    price: "₹3,999",
  },
  {
    id: 3,
    image: img3,
    title: "Minimal Leather Jacket",
    category: "Jackets",
    price: "₹12,999",
  },
  {
    id: 4,
    image: img4,
    title: "Premium Linen Pants",
    category: "Bottomwear",
    price: "₹4,999",
  },
  {
    id: 5,
    image: img5,
    title: "Luxury Knit Sweater",
    category: "Knitwear",
    price: "₹5,999",
  },
  {
    id: 6,
    image: img6,
    title: "Classic White Tee",
    category: "T-Shirts",
    price: "₹2,499",
  },
  {
    id: 7,
    image: img7,
    title: "Structured Coat",
    category: "Outerwear",
    price: "₹9,999",
  },
  {
    id: 8,
    image: img8,
    title: "Essential Hoodie",
    category: "Hoodies",
    price: "₹3,499",
  },
];

function NewArrivals() {
  return (
    <main className="new-page">

      {/* HERO */}

      <section className="new-hero">

        <img
          src={hero}
          alt="New Arrivals"
        />

        <div className="new-overlay"></div>

        <div className="new-hero-content">

          <span className="new-hero-tag">
            NEW ARRIVALS 2026
          </span>

          <h1>
            The Latest
            <br />
            Collection
          </h1>

          <p>
            Discover timeless silhouettes crafted
            for the modern wardrobe.
          </p>

          <div className="new-hero-buttons">

            <PrimaryButton
              text="Explore Collection"
              to="/products"
            />

            <Link
              to="/about"
              className="new-hero-link"
            >
              Discover More →
            </Link>

          </div>

        </div>

      </section>

      {/* HEADING */}

      <section className="new-heading">

        <h2>New Arrivals</h2>

        <p>
          Curated pieces inspired by modern luxury
          and effortless elegance.
        </p>

      </section>

      {/* FILTER */}

      <section className="new-filter">

        <button>All</button>
        <button>Men</button>
        <button>Women</button>
        <button>Trending</button>
        <button>Editor's Picks</button>

        <select>
          <option>Newest</option>
          <option>Price Low-High</option>
          <option>Price High-Low</option>
        </select>

      </section>

      {/* PRODUCTS */}

      <section className="new-grid">

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

      </section>
            {/* EDITORIAL */}

      <section className="new-editorial">

        <img
          src={editorial}
          alt="Editorial"
        />

        <div className="new-editorial-overlay">

          <span>EDITORIAL</span>

          <h2>
            Designed
            <br />
            Without
            <br />
            Compromise
          </h2>

          <p>
            Every garment is thoughtfully crafted
            to deliver timeless style and exceptional
            quality for the modern wardrobe.
          </p>

          <PrimaryButton
            text="Explore Collection"
            to="/products"
          />

        </div>

      </section>

      {/* MORE PRODUCTS */}

      <section className="new-grid">

        {[...products].reverse().map((product) => (

          <ProductCard
            key={`second-${product.id}`}
            id={product.id}
            image={product.image}
            title={product.title}
            category={product.category}
            price={product.price}
          />

        ))}

      </section>

    </main>
  );
}

export default NewArrivals;