import { useState } from "react";
import { loginUser } from "../../services/authservices";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import "./Login.css";
import fashionImg from "../../assets/fashion.jpg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || "/";
  const justRegistered = location.state?.justRegistered;

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const data = await loginUser({
        email: email.trim(),
        password,
      });

      if (data?.success) {
        if (data.user) {
          login(data.user, data.token);
        }
        if (data.user?.role === "admin") {
          navigate("/admin/products");
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setErrorMessage(data?.message || "Invalid credentials provided.");
      }
    } catch (error) {
      console.error(error);
      const isUnverified = error.response?.data?.isVerified === false;
      if (isUnverified) {
        setErrorMessage(error.response?.data?.message || "Account not verified. Redirecting to verification...");
        setTimeout(() => {
          navigate("/register", {
            state: {
              email: error.response.data.email || email.trim(),
              name: error.response.data.name || "",
              step: "otp",
            },
          });
        }, 1500);
      } else {
        setErrorMessage(
          error.response?.data?.message || "Invalid email or password. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      {/* LEFT EDITORIAL COLUMN */}
      <section className="login-left" aria-hidden="true">
        <img
          src={fashionImg}
          alt="SEEMZ Editorial Atelier"
          className="hero-image"
        />
        <div className="overlay" />

        <div className="hero-content">
          <h1>
            WELCOME
            <br />
            BACK
          </h1>

          <div className="hero-description">
            <div className="line" />
            <div>
              <h4>SEEMZ ATELIER</h4>
              <p>Continue your luxury journey with timeless confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT FORM COLUMN */}
      <section className="login-right">
        <div className="login-form-container">
          <span className="brand-tag">SEEMZ PRIVATE CLIENT</span>
          <Link to="/" className="logo">SEEMZ</Link>
          <h2 className="login-title">Sign In</h2>
          <p className="subtitle">Enter your credentials to access your private account.</p>

          {justRegistered && (
            <div className="auth-alert success" role="status">
              <CheckCircle2 size={16} />
              <span>Account created successfully. Please sign in below.</span>
            </div>
          )}

          {errorMessage && (
            <div className="auth-alert error" role="alert">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                required
                placeholder="client@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label htmlFor="login-password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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

            <div className="forgot">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "AUTHENTICATING..." : "SIGN IN"}
            </button>

            <p className="bottom-text">
              Don't have an account?{" "}
              <Link to="/register">Create Account</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

export default Login;