import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/authservices";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = await forgotPassword({ email });

      alert(data.message || "OTP sent successfully!");

      navigate("/reset-password");
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h1 className="logo">SEEMZ</h1>

        <h2>Forgot Password</h2>

        <p className="subtitle">
          Enter your registered email address.
          <br />
          We'll send a one-time verification code.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "SENDING..." : "SEND OTP"}
          </button>
        </form>

        <Link to="/login" className="back-link">
          ← Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;