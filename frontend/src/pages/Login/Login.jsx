import { useState } from "react";
import { loginUser } from "../../services/authservices";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { Link } from "react-router-dom";
import fashionImg from "../../assets/fashion.jpg";


function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

async function handleSubmit(e) {
  e.preventDefault();

  try {
    const data = await loginUser({
      email,
      password,
    });

    console.log(data);

    alert("Login Successful");

    navigate("/");

  } catch (error) {
    console.log(error);

    alert("Login Failed");
  }
}
   return (
    <div className="register-page">
      {/* LEFT */}
      <div className="register-left">
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
              <h4>WELCOME BACK</h4>

              <p>
                Continue your journey with timeless fashion.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}

      <div className="register-right">

        <span className="brand-tag">
          EST. 2026
        </span>

        <h1 className="logo">
          SEEMZ
        </h1>

        <h2>Welcome Back</h2>

        <p className="subtitle">
          Sign in to continue your luxury journey.
        </p>
<form onSubmit={handleSubmit}>

  <div className="input-group">
    <label>Email Address</label>
    <input
      type="email"
      placeholder="Enter your email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
  </div>

  <div className="input-group">
    <label>Password</label>
    <input
      type="password"
      placeholder="Enter your password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />
  </div>

  <div className="forgot">
    <Link to="/forgot-password">
      Forgot Password?
    </Link>
  </div>

  <button type="submit">
    SIGN IN
  </button>

  <p className="bottom-text">
    Don't have an account?{" "}
    <Link to="/register">
      Create Account
    </Link>
  </p>

</form>

      </div>
    </div>
  );
};

export default Login;