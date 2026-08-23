import { useState } from "react";
import { loginUser } from "../../services/authservices";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
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
        email,
        password,
      });

      if (data?.success) {
        if (data.user) {
          login(data.user);
        }
        if (data.user?.role === "admin") {
          navigate("/admin/products");
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setErrorMessage(data?.message || "Login failed");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.response?.data?.message || "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      {/* LEFT EDITORIAL */}
      <div className="login-left">
        <img
          src={fashionImg}
          alt="Fashion"
          className="hero-image"
        />
        <div className="overlay"></div>

        <div className="hero-content">
          <h1>
            WELCOME
            <br />
            BACK
          </h1>

          <div className="hero-description">
            <div className="line"></div>
            <div>
              <h4>SEEMZ ATELIER</h4>
              <p>Continue your luxury journey with timeless confidence.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="login-right">
        <span className="brand-tag">EST. 2026</span>
        <h1 className="logo">SEEMZ</h1>
        <h2>Client Sign In</h2>
        <p className="subtitle">Enter your credentials to access your private account.</p>

        {justRegistered && (
          <div style={{ color: "#4ade80", fontSize: "12px", letterSpacing: "1px", marginBottom: "16px", padding: "12px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
            Account created successfully. Please sign in.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {errorMessage && (
            <div style={{ color: "#ef4444", fontSize: "12px", letterSpacing: "1px", marginBottom: "16px", padding: "12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {errorMessage}
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your password"
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
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div className="forgot">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "AUTHENTICATING..." : "SIGN IN"}
          </button>

          <p className="bottom-text">
            Don't have an account?{" "}
            <Link to="/register">Create Account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;