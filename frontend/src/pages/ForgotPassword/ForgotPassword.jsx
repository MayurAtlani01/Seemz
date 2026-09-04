import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/authservices";
import { Mail, ArrowLeft, KeyRound, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    try {
      setLoading(true);
      const data = await forgotPassword({ email: email.trim() });
      setMessage(data?.message || "Verification code dispatched to your email address.");
      setTimeout(() => {
        navigate("/reset-password", { state: { email: email.trim() } });
      }, 1400);
    } catch (err) {
      setError(err.response?.data?.message || "Could not process request. Please verify your email.");
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
              <KeyRound size={22} strokeWidth={1.5} />
            </div>
            <span className="standalone-eyebrow">SECURITY RECOVERY</span>
            <h1 className="standalone-title">Reset Password</h1>
            <p className="standalone-subtitle">
              Enter your registered email address. We will dispatch a 6-digit verification code to securely restore your atelier account access.
            </p>
          </div>

          {/* LIGHT-YELLOW ALERTS */}
          {message && (
            <div className="auth-alert success" role="status">
              <CheckCircle2 size={17} />
              <div className="alert-content">
                <strong>Code Dispatched</strong>
                <span>{message}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="auth-alert error" role="alert">
              <AlertCircle size={17} />
              <div className="alert-content">
                <strong>Recovery Notice</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="auth-field-group">
              <label htmlFor="forgot-email" className="auth-label">
                Registered Email Address
              </label>
              <div className="auth-input-container">
                <Mail size={16} className="auth-field-icon" />
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="auth-input"
                  autoFocus
                />
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
                  DISPATCHING CODE...
                </span>
              ) : (
                "SEND VERIFICATION CODE"
              )}
            </button>
          </form>

          <div className="standalone-footer">
            <div className="security-guarantee">
              <Shield size={13} />
              <span>Encrypted identity authentication</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;