import "./Hero.css";
import PrimaryButton from "../PrimaryButton/PrimaryButton";

const Hero = ({
  video,
  image,
  subtitle,
  title,
  description,
  buttonText,
  buttonLink,
  overlay = 0.45,
  height = "100vh",
}) => {
  return (
    <section
      className="hero"
      style={{ height }}
    >
      {video ? (
        <video
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
        >
          <source
            src={video}
            type="video/mp4"
          />
        </video>
      ) : (
        <img
          src={image}
          alt={title}
          className="hero-image"
        />
      )}

      <div
        className="hero-overlay"
        style={{
          background: `rgba(0,0,0,${overlay})`,
        }}
      ></div>

      <div className="hero-content">
        <p>{subtitle}</p>

        <h1>{title}</h1>

        {description && (
          <span>{description}</span>
        )}

        {buttonText && (
          <PrimaryButton
            text={buttonText}
            to={buttonLink}
          />
        )}
      </div>
    </section>
  );
};

export default Hero;