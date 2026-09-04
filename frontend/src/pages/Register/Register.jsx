import { useState, useEffect } from "react";
import { registerUser, verifyRegisterOTP, resendRegisterOTP } from "../../services/authservices";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, KeyRound, AlertCircle, CheckCircle2, RotateCcw, ShieldCheck } from "lucide-react";
import editorialImg from "../../assets/images/editorialImg.jpg";
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
      setErrorMessage("Please complete all required fields.");
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
          "Registration failed. Please try again."
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
      setSuccessMessage(data?.message || "Account verified successfully.");
      if (data?.token) {
        localStorage.setItem("token", data.token);
        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        window.dispatchEvent(new Event("authChange"));
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1200);
      } else {
        setTimeout(() => {
          navigate("/login", {
            state: { justRegistered: true },
          });
        }, 1400);
      }
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
      setSuccessMessage(data?.message || "Verification code resent.");
      setResendCooldown(60);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Could not resend code. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-portal-page">
      {/* LEFT EDITORIAL IMAGE (ORIGINAL COLOR) */}
      <section className="auth-editorial-panel" aria-hidden="true">
        <img
          src={editorialImg}
          alt="SEEMZ Collection"
          className="editorial-media-img"
        />
        <div className="editorial-ambient-overlay" />

        <div className="editorial-panel-header">
          <span className="editorial-tag">ATELIER PRIVILEGES • 2026</span>
          <span className="editorial-edition">BESPOKE MEMBERSHIP</span>
        </div>

        <div className="editorial-panel-content">
          <span className="editorial-subheading">JOIN THE HOUSE</span>
          <h1 className="editorial-headline">
            Essence of
            <br />
            <em>Modern Luxury</em>
          </h1>

          <div className="editorial-quote-box">
            <div className="quote-accent-line" />
            <p className="quote-text">
              "Crafted silhouettes. Tailored precision. An uncompromising commitment to timeless elegance."
            </p>
          </div>
        </div>

        <div className="editorial-panel-footer">
          <div className="perk-pill">
            <ShieldCheck size={14} />
            <span>Complimentary Global Priority Dispatch</span>
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

          {/* Form Card Container */}
          <div className="auth-form-card">
            {/* Mode Switcher Tabs */}
            <div className="auth-mode-switcher">
              <Link to="/login" className="auth-switch-tab">
                Sign In
              </Link>
              <button
                type="button"
                className="auth-switch-tab active"
                aria-current="page"
              >
                Create Account
              </button>
            </div>

            <div className="auth-card-header">
              <h2 className="auth-card-title">
                {step === "form" ? "Create Account" : "Verify Email"}
              </h2>
            </div>

            {/* SEEMZ LIGHT-YELLOW ALERTS */}
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
              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="auth-field-group">
                  <label htmlFor="reg-name" className="auth-label">
                    Full Name
                  </label>
                  <div className="auth-input-container">
                    <User size={16} className="auth-field-icon" />
                    <input
                      id="reg-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="auth-field-group">
                  <label htmlFor="reg-email" className="auth-label">
                    Email
                  </label>
                  <div className="auth-input-container">
                    <Mail size={16} className="auth-field-icon" />
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="auth-field-group">
                  <label htmlFor="reg-password" className="auth-label">
                    Password
                  </label>
                  <div className="auth-input-container">
                    <Lock size={16} className="auth-field-icon" />
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
                </button>

                <div className="auth-footer-prompt">
                  <span>Already have an account?</span>
                  <Link to="/login" className="auth-inline-link">
                    Sign In
                  </Link>
                </div>
              </form>
            ) : (
              /* STEP 2: OTP Verification Form */
              <form onSubmit={handleVerifyOTP} className="auth-form" noValidate>
                <div className="auth-field-group">
                  <label htmlFor="otp-input" className="auth-label">
                    Verification Code
                  </label>
                  <div className="auth-input-container">
                    <KeyRound size={16} className="auth-field-icon" />
                    <input
                      id="otp-input"
                      type="text"
                      maxLength={6}
                      placeholder="••••••"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      required
                      autoFocus
                      className="auth-input otp-digit-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-action-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "VERIFYING..." : "VERIFY & CONTINUE"}
                </button>

                <div className="auth-otp-actions-bar">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isSubmitting || resendCooldown > 0}
                    className="otp-resend-btn"
                  >
                    <RotateCcw size={13} />
                    <span>
                      {resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : "Resend Code"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="otp-edit-btn"
                  >
                    Change Email
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Register;