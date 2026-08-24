import { useState } from "react";
import { registerUser } from "../../services/authservices";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import fashionImage from "../../assets/fashion.jpg";
import "./Register.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigate("/login", {
        state: { justRegistered: true },
      });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Registration failed. Please check your details and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="register-page">
      {/* LEFT EDITORIAL COLUMN */}
      <section className="image-section" aria-hidden="true">
        <img
          src={fashionImage}
          alt="SEEMZ Essence of Luxury"
        />
        <div className="image-overlay" />

        <div className="hero-content">
          <h2 className="hero-title">
            ESSENCE
            <span>OF LUXURY</span>
          </h2>

          <div className="hero-footer">
            <div className="line" />
            <div>
              <h3>SEEMZ ATELIER</h3>
              <p>Discover pieces crafted for the modern individual.</p>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT FORM COLUMN */}
      <section className="form-section">
        <div className="form-container">
          <span className="brand-tag">SEEMZ CLIENTELE</span>
          <Link to="/" className="logo">SEEMZ</Link>
          <h2 className="title">Create Account</h2>
          <p className="subtitle">Join our private clientele for bespoke releases and collections.</p>

          {errorMessage && (
            <div className="auth-alert error" role="alert">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                placeholder="Alexander Vance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="client@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="reg-password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "CREATING ACCOUNT..."
                : "CREATE ACCOUNT"}
            </button>
          </form>

          <p className="login-text">
            Already a member?{" "}
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