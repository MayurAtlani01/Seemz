import { useState } from "react";
import { registerUser } from "../../services/authservices";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
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
          "Registration failed. Please check your credentials."
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
            <span>OF LUXURY</span>
          </h2>

          <div className="hero-footer">
            <div className="line"></div>
            <div>
              <h3>SEEMZ ATELIER</h3>
              <p>Discover pieces crafted for the modern individual.</p>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className="form-section">
        <div className="form-container">
          <p className="brand-tag">SEEMZ STUDIO</p>
          <h1 className="logo">SEEMZ</h1>
          <h2 className="title">Create Account</h2>
          <p className="subtitle">Join our private clientele for bespoke releases and collections.</p>

          <form onSubmit={handleSubmit} noValidate>
            {errorMessage && (
              <p className="form-error" role="alert">
                {errorMessage}
              </p>
            )}

            <div className="input-group">
              <label htmlFor="name">FULL NAME</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Alexander Vance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">EMAIL ADDRESS</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="e.g. client@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">PASSWORD</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
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