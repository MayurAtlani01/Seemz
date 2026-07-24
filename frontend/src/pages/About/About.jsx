import "./About.css";
import AboutImage from "../../assets/images/AboutImage.jpg"
import { useNavigate } from "react-router-dom";



const About = () => {
  
const navigate = useNavigate();
  return (
    <main className="about">

      {/* HERO */}

      <section className="about-hero">
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

      <section className="about-image">
        <img
          src={AboutImage}
          alt="Editorial Fashion"
        />
      </section>

      {/* STORY */}

      <section className="about-story">

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

      {/* PHILOSOPHY */}

      <section className="philosophy">

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

      <section className="about-quote">

        <h2>
          Luxury isn't about being seen.
          <br />
          It's about being remembered.
        </h2>

      </section>

      {/* CTA */}

      <section className="about-cta">

        <h2>Discover the Collection</h2>

        <p>
          Explore timeless essentials crafted for the modern wardrobe.
        </p>

    <button onClick={() => navigate("/")}>
  SHOP NOW
</button>

      </section>

    </main>
  );
};

export default About;