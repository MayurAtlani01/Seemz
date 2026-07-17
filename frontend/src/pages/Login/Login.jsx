import { useState } from "react";
import { loginUser } from "../../services/authservices";
import { useNavigate } from "react-router-dom";


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
  return(
    <div>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <br />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <br />

        <div>
          <label>Password</label>
          <br />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <br />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;