import { useState } from "react";
import { registerUser } from "../../services/authservices";
import { useNavigate, Link } from "react-router-dom";
import fashionImage from "../../assets/fashion.jpg";
import "./Register.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await registerUser({
        name,
        email,
        password,
      });

      navigate("/login", {
        state: { justRegistered: true },
      });

    } catch (error) {

      setErrorMessage(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );

    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="register-page">

      {/* LEFT PANEL */}

      <section className="image-section">

    <img
        src={fashionImage}
        alt="Luxury Fashion"
    />

    <div className="image-overlay"></div>

    <div className="hero-content">

        <h2 className="hero-title">
            ESSENCE
            <br />
            OF STYLE
        </h2>

        <div className="hero-footer">

            <div className="line"></div>

            <div>

                <h3>
                    ESSENCE OF STYLE
                </h3>

                <p>
                    Discover pieces crafted for the modern individual.
                </p>

            </div>

        </div>

    </div>

</section>
      {/* RIGHT PANEL */}

      <section className="form-section">

        <div className="form-container">

          <p className="brand-tag">
            MAISON DE MODE
          </p>

          <h1 className="logo">
            SEEMZ
          </h1>

          <h2 className="title">
            CREATE ACCOUNT
          </h2>

          <p className="subtitle">
            Discover timeless fashion.
          </p>

          <form onSubmit={handleSubmit} noValidate>

            {errorMessage && (
              <p
                className="form-error"
                role="alert"
              >
                {errorMessage}
              </p>
            )}

            <div className="input-group">

              <label htmlFor="name">
                FULL NAME
              </label>

              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

            </div>

            <div className="input-group">

              <label htmlFor="email">
                EMAIL ADDRESS
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

            </div>

            <div className="input-group">

              <label htmlFor="password">
                PASSWORD
              </label>

              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />

            </div>

            <button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "CREATING ACCOUNT..."
                : "CREATE ACCOUNT"}
            </button>

          </form>

          <p className="login-text">

            Already a member?

            <Link to="/login">
              Sign In
            </Link>

          </p>

        </div>

      </section>

    </main>
  );
}

export default Register;