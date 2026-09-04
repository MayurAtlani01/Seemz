import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { resetPassword } from "../../services/authservices";
import { Eye, EyeOff, Mail, Lock, KeyRound, ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
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
      setError("Please complete all required fields.");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      const data = await resetPassword(formData);
      setMessage(data?.message || "Password updated successfully. Redirecting to sign in...");
      setTimeout(() => {
        navigate("/login");
      }, 1400);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid verification code or request expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-standalone-page">
      <div className="standalone-ambient-bg" />

      <div className="standalone-card-wrap">
        <div className="standalone-top-nav">
          <Link to="/login" className="auth-back-link">
            <ArrowLeft size={14} />
            <span>Return to Sign In</span>
          </Link>
          <Link to="/" className="auth-brand-logo">
            SEEMZ
          </Link>
        </div>

        <div className="standalone-card">
          <div className="standalone-header">
            <div className="standalone-badge-icon">
              <ShieldCheck size={22} strokeWidth={1.5} />
            </div>
            <span className="standalone-eyebrow">CREDENTIAL UPDATE</span>
            <h1 className="standalone-title">Set New Password</h1>
            <p className="standalone-subtitle">
              Enter the 6-digit code sent to your email and create a new secure password.
            </p>
          </div>

          {/* LIGHT-YELLOW ALERTS */}
          {message && (
            <div className="auth-alert success" role="status">
              <CheckCircle2 size={17} />
              <div className="alert-content">
                <strong>Password Updated</strong>
                <span>{message}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="auth-alert error" role="alert">
              <AlertCircle size={17} />
              <div className="alert-content">
                <strong>Update Notice</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="auth-field-group">
              <label htmlFor="reset-email" className="auth-label">
                Account Email
              </label>
              <div className="auth-input-container">
                <Mail size={16} className="auth-field-icon" />
                <input
                  id="reset-email"
                  type="email"
                  name="email"
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                  className="auth-input"
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label htmlFor="reset-otp" className="auth-label">
                6-Digit Verification Code
              </label>
              <div className="auth-input-container">
                <KeyRound size={16} className="auth-field-icon" />
                <input
                  id="reset-otp"
                  type="text"
                  name="otp"
                  maxLength={6}
                  placeholder="123456"
                  value={formData.otp}
                  onChange={(e) =>
                    setFormData({ ...formData, otp: e.target.value.replace(/\D/g, "") })
                  }
                  autoComplete="one-time-code"
                  required
                  autoFocus
                  className="auth-input otp-digit-input"
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label htmlFor="reset-newpassword" className="auth-label">
                New Password
              </label>
              <div className="auth-input-container">
                <Lock size={16} className="auth-field-icon" />
                <input
                  id="reset-newpassword"
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="Minimum 6 characters"
                  value={formData.newPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={6}
                  required
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
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading-wrap">
                  <span className="btn-spinner" />
                  UPDATING CREDENTIALS...
                </span>
              ) : (
                "CONFIRM & SAVE PASSWORD"
              )}
            </button>
          </form>

          <div className="standalone-footer">
            <Link to="/forgot-password" className="auth-forgot-link">
              Didn't receive a code? Request new one
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;