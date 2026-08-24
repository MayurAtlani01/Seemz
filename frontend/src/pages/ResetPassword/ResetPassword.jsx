import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { resetPassword } from "../../services/authservices";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import "./ResetPassword.css";

const ResetPassword = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: location.state?.email || "",
    otp: "",
    newPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!formData.email.trim() || !formData.otp.trim() || !formData.newPassword) {
      setError("Please complete all fields.");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const data = await resetPassword(formData);
      setMessage(data?.message || "Password updated successfully. Redirecting...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP or request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="forgot-container">
      <div className="forgot-card">
        <Link to="/" className="logo">SEEMZ</Link>

        <h2>Reset Password</h2>

        <p className="subtitle">
          Enter the verification code sent to your email and select a new secure password.
        </p>

        {message && (
          <div className="auth-alert success" role="status">
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="auth-alert error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="reset-email">Email Address</label>
            <input
              id="reset-email"
              type="email"
              name="email"
              placeholder="client@domain.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="reset-otp">Verification Code (OTP)</label>
            <input
              id="reset-otp"
              type="text"
              name="otp"
              placeholder="Enter 6-digit OTP"
              value={formData.otp}
              onChange={handleChange}
              autoComplete="one-time-code"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="reset-newpassword">New Password</label>
            <div className="password-input-wrapper">
              <input
                id="reset-newpassword"
                type={showPassword ? "text" : "password"}
                name="newPassword"
                placeholder="Min. 6 characters"
                value={formData.newPassword}
                onChange={handleChange}
                autoComplete="new-password"
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

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "UPDATING PASSWORD..." : "SET NEW PASSWORD"}
          </button>
        </form>

        <Link to="/login" className="back-link">
          ← Back to Sign In
        </Link>
      </div>
    </main>
  );
};

export default ResetPassword;