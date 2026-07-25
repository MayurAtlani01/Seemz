import "./Newsletter.css";

const Newsletter = () => {
  return (
    <section className="newsletter">

      <div className="newsletter-container">

        <p className="newsletter-subtitle">
          STAY CONNECTED
        </p>

        <h2>
          Join The SEEMZ Community
        </h2>

        <span>
          Be the first to discover exclusive collections,
          editorial stories, styling inspiration, and member-only offers.
        </span>

        <form className="newsletter-form">

          <input
            type="email"
            placeholder="Enter your email"
          />

          <button type="submit">
            SUBSCRIBE
          </button>

        </form>

      </div>

    </section>
  );
};

export default Newsletter;