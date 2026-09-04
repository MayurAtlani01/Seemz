import { useState } from "react";
import { loginUser } from "../../services/authservices";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
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

    if (!email.trim() || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

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
        setErrorMessage(error.response?.data?.message || "Account not verified. Redirecting...");
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
    <main className="auth-portal-page">
      {/* LEFT EDITORIAL IMAGE (ORIGINAL COLOR) */}
      <section className="auth-editorial-panel" aria-hidden="true">
        <img
          src={fashionImg}
          alt="SEEMZ Collection"
          className="editorial-media-img"
        />
        <div className="editorial-ambient-overlay" />

        <div className="editorial-panel-header">
          <span className="editorial-tag">SEEMZ ATELIER • 2026</span>
          <span className="editorial-edition">PRIVATE ACCESS</span>
        </div>

        <div className="editorial-panel-content">
          <span className="editorial-subheading">AUTUMN / WINTER 2026</span>
          <h1 className="editorial-headline">
            Welcome Back
            <br />
            <em>Modern Precision</em>
          </h1>

          <div className="editorial-quote-box">
            <div className="quote-accent-line" />
            <p className="quote-text">
              "Architecture for the human form. Every garment meticulously tailored to your unique proportions."
            </p>
          </div>
        </div>

        <div className="editorial-panel-footer">
          <div className="perk-pill">
            <ShieldCheck size={14} />
            <span>Encrypted Identity & Atelier Access</span>
          </div>
        </div>
      </section>

      {/* RIGHT AUTH FORM STAGE */}
      <section className="auth-stage-panel">
        <div className="auth-stage-inner">
          {/* Top Bar Navigation */}
          <div className="auth-top-nav">
            <Link to="/" className="auth-back-link">
              <ArrowLeft size={14} />
              <span>Back to Store</span>
            </Link>
            <Link to="/" className="auth-brand-logo">
              SEEMZ
            </Link>
          </div>

          {/* Form Card */}
          <div className="auth-form-card">
            {/* Mode Switcher */}
            <div className="auth-mode-switcher">
              <button
                type="button"
                className="auth-switch-tab active"
                aria-current="page"
              >
                Sign In
              </button>
              <Link to="/register" className="auth-switch-tab">
                Create Account
              </Link>
            </div>

            <div className="auth-card-header">
              <h2 className="auth-card-title">Sign In</h2>
            </div>

            {/* SEEMZ LIGHT-YELLOW ALERTS */}
            {justRegistered && (
              <div className="auth-alert success" role="status">
                <CheckCircle2 size={16} />
                <span>Account verified successfully. Please sign in below.</span>
              </div>
            )}

            {errorMessage && (
              <div className="auth-alert error" role="alert">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="auth-field-group">
                <label htmlFor="login-email" className="auth-label">
                  Email
                </label>
                <div className="auth-input-container">
                  <Mail size={16} className="auth-field-icon" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <div className="auth-label-row">
                  <label htmlFor="login-password" className="auth-label">
                    Password
                  </label>
                  <Link to="/forgot-password" className="auth-forgot-link">
                    Forgot Password?
                  </Link>
                </div>
                <div className="auth-input-container">
                  <Lock size={16} className="auth-field-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="auth-input password-input"
                  />
                  <button
                    type="button"
                    className="auth-visibility-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-action-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "SIGNING IN..." : "SIGN IN"}
              </button>

              <div className="auth-footer-prompt">
                <span>Don't have an account?</span>
                <Link to="/register" className="auth-inline-link">
                  Create Account
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;