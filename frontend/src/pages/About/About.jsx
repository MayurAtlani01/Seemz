import "./About.css";
import AboutImage from "../../assets/images/AboutImage.jpg";
import { useNavigate } from "react-router-dom";
import OutfitAssembly from "../../components/OutfitAssembly/OutfitAssembly";
import useCinematicScroll from "../../hooks/useCinematicScroll";

const About = () => {
  const navigate = useNavigate();

  const heroScroll = useCinematicScroll({ dampening: 0.12 });
  const imageScroll = useCinematicScroll({ dampening: 0.14 });
  const storyScroll = useCinematicScroll({ dampening: 0.12 });
  const quoteScroll = useCinematicScroll({ dampening: 0.12 });

  return (
    <main className="about">

      {/* HERO */}
      <section ref={heroScroll.ref} className="about-hero cinematic-stage">
        <span className="about-tag">ABOUT SEEMZ</span>

        <h1>
          Fashion that lives
          <br />
          beyond trends.
        </h1>

        <p>
          SEEMZ is built on the belief that luxury is timeless.
          Every collection is designed with precision, minimalism,
          and craftsmanship to create pieces that remain relevant
          season after season.
        </p>
      </section>

      {/* IMAGE */}
      <section ref={imageScroll.ref} className="about-image cinematic-split-image-frame">
        <img
          src={AboutImage}
          alt="Editorial Fashion"
          style={{
            transform: `scale(1.05) translateY(${(imageScroll.scrollProgress - 0.5) * -40}px)`,
          }}
        />
      </section>

      {/* STORY */}
      <section ref={storyScroll.ref} className="about-story cinematic-reveal-wrap is-visible">
        <div className="story-heading">
          <h2>OUR STORY</h2>
        </div>

        <div className="story-content">
          <p>
            SEEMZ was founded with one vision — to redefine
            everyday luxury through timeless essentials.
            We believe clothing should never be disposable.
            Every garment is thoughtfully designed to outlive
            trends while remaining effortlessly modern.
          </p>

          <p>
            Inspired by editorial fashion and premium tailoring,
            our collections combine clean silhouettes,
            refined materials and uncompromising craftsmanship.
            Luxury, for us, is found in the details.
          </p>
        </div>
      </section>

      {/* INTERACTIVE OUTFIT ASSEMBLY */}
      <OutfitAssembly />

      {/* PHILOSOPHY */}
      <section className="philosophy cinematic-reveal-wrap is-visible">
        <div className="philosophy-card">
          <h3>QUALITY</h3>
          <p>
            Every stitch, fabric and finish is chosen to deliver
            lasting comfort and premium craftsmanship.
          </p>
        </div>

        <div className="philosophy-card">
          <h3>MINIMALISM</h3>
          <p>
            Clean silhouettes and timeless designs that never
            rely on loud branding or short-lived trends.
          </p>
        </div>

        <div className="philosophy-card">
          <h3>TIMELESS</h3>
          <p>
            Pieces designed to remain relevant season after
            season, creating a wardrobe that lasts.
          </p>
        </div>
      </section>

      {/* QUOTE */}
      <section ref={quoteScroll.ref} className="about-quote">
        <h2
          className={`cinematic-focus-text ${
            quoteScroll.scrollProgress > 0.15 && quoteScroll.scrollProgress < 0.85
              ? "in-focus"
              : "out-of-focus"
          }`}
        >
          Luxury isn't about being seen.
          <br />
          It's about being remembered.
        </h2>
      </section>

      {/* CTA */}
      <section className="about-cta cinematic-reveal-wrap is-visible">
        <h2>Discover the Collection</h2>

        <p>
          Explore timeless essentials crafted for the modern wardrobe.
        </p>

        <button
          className="about-shop-btn"
          onClick={() => navigate("/products")}
        >
          <span className="btn-text">SHOP NOW</span>
          <span className="btn-icon">→</span>
        </button>
      </section>

    </main>
  );
};

export default About;