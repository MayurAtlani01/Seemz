import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/authservices";
import { AlertCircle, CheckCircle2 } from "lucide-react";
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
      setMessage(data?.message || "Verification code sent to your email.");
      setTimeout(() => {
        navigate("/reset-password", { state: { email: email.trim() } });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Could not process request. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="forgot-container">
      <div className="forgot-card">
        <Link to="/" className="logo">SEEMZ</Link>

        <h2>Forgot Password</h2>

        <p className="subtitle">
          Enter your registered email address to receive a one-time verification code.
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
            <label htmlFor="forgot-email">Email Address</label>
            <input
              id="forgot-email"
              type="email"
              placeholder="client@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "SENDING CODE..." : "SEND VERIFICATION CODE"}
          </button>
        </form>

        <Link to="/login" className="back-link">
          ← Back to Sign In
        </Link>
      </div>
    </main>
  );
};

export default ForgotPassword;