import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../../services/authservices";
import "./ResetPassword.css";

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = await resetPassword(formData);

      alert(data.message || "Password reset successfully!");

      navigate("/login");
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

        <h2>Reset Password</h2>

        <p className="subtitle">
          Enter the OTP sent to your email and choose a new password.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email Address</label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>OTP</label>

            <input
              type="text"
              name="otp"
              placeholder="Enter OTP"
              value={formData.otp}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>New Password</label>

            <input
              type="password"
              name="newPassword"
              placeholder="Enter new password"
              value={formData.newPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "RESETTING..." : "RESET PASSWORD"}
          </button>
        </form>

        <Link to="/login" className="back-link">
          ← Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;