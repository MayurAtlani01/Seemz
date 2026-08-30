import { useState, useEffect } from "react";
import { registerUser, verifyRegisterOTP, resendRegisterOTP } from "../../services/authservices";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import fashionImage from "../../assets/fashion.jpg";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  // Load state if redirected from an unverified login attempt
  const redirectEmail = location.state?.email || "";
  const redirectName = location.state?.name || "";
  const redirectStep = location.state?.step || "form";

  const [name, setName] = useState(redirectName);
  const [email, setEmail] = useState(redirectEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP State
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(redirectStep); // 'form' or 'otp'
  const [resendCooldown, setResendCooldown] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Manage Resend Cooldown Countdown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Set cooldown on initial enter if step is otp
  useEffect(() => {
    if (step === "otp" && resendCooldown === 0) {
      setResendCooldown(60);
    }
  }, [step]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setSuccessMessage(data?.message || "Verification code sent to your email.");
      setStep("otp");
      setResendCooldown(60);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Registration failed. Please check your details and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!otp.trim()) {
      setErrorMessage("Please enter the 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await verifyRegisterOTP(email.trim(), otp.trim());
      setSuccessMessage(data?.message || "Account activated! Redirecting...");
      setTimeout(() => {
        navigate("/login", {
          state: { justRegistered: true },
        });
      }, 1500);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Verification failed. Please check the code and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOTP() {
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const data = await resendRegisterOTP(email.trim());
      setSuccessMessage(data?.message || "Verification code resent successfully.");
      setResendCooldown(60);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Could not resend code. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="register-page">
      {/* LEFT EDITORIAL COLUMN */}
      <section className="image-section" aria-hidden="true">
        <img
          src={fashionImage}
          alt="SEEMZ Essence of Luxury"
        />
        <div className="image-overlay" />

        <div className="hero-content">
          <h2 className="hero-title">
            ESSENCE
            <span>OF LUXURY</span>
          </h2>

          <div className="hero-footer">
            <div className="line" />
            <div>
              <h3>SEEMZ ATELIER</h3>
              <p>Discover pieces crafted for the modern individual.</p>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT FORM COLUMN */}
      <section className="form-section">
        <div className="form-container">
          <span className="brand-tag">SEEMZ CLIENTELE</span>
          <Link to="/" className="logo">SEEMZ</Link>

          {step === "form" ? (
            <>
              <h2 className="title">Create Account</h2>
              <p className="subtitle">Join our private clientele for bespoke releases and collections.</p>
            </>
          ) : (
            <>
              <h2 className="title">Verify Email</h2>
              <p className="subtitle">Enter the 6-digit authentication code sent to {email}.</p>
            </>
          )}

          {successMessage && (
            <div className="auth-alert success" role="status">
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="auth-alert error" role="alert">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === "form" ? (
            /* STEP 1: Registration Form */
            <form onSubmit={handleSubmit} noValidate>
              <div className="input-group">
                <label htmlFor="reg-name">Full Name</label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Alexander Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="reg-email">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="client@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="reg-password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "SENDING CODE..." : "CREATE ACCOUNT"}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP Verification Form */
            <form onSubmit={handleVerifyOTP} noValidate>
              <div className="input-group">
                <label htmlFor="otp-input">Verification Code (OTP)</label>
                <input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "ACTIVATING..." : "VERIFY CODE"}
              </button>

              <div className="otp-actions" style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isSubmitting || resendCooldown > 0}
                  style={{
                    background: "none",
                    border: "none",
                    color: resendCooldown > 0 ? "#555555" : "#ffffff",
                    cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                    textDecoration: "underline",
                    fontSize: "12px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    padding: 0
                  }}
                >
                  {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("form")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#888888",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontSize: "12px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    padding: 0
                  }}
                >
                  Edit Email
                </button>
              </div>
            </form>
          )}

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