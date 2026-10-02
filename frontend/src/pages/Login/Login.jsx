import { useState } from "react";
import Icon from "../../components/Icon";
import { loginAdmin } from "../../services/api";
import "./Login.css";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      await loginAdmin(email, password);

      if (onLogin) {
        onLogin();
      }
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-visual">

        <div className="login-content">

          {/* BRAND */}
          <div className="login-brand">

            <div className="login-logo">
              <Icon name="qr" size={25} />
            </div>

            <div className="login-brand-text">
              <span className="login-brand-title">
                ReviewQR
              </span>
            </div>

          </div>


          {/* LOGIN FORM */}
          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            {/* EMAIL */}
            <div className="login-field">

              <label htmlFor="admin-email">
                Email address
              </label>

              <div className="login-input-wrapper">

                <span className="login-input-icon">
                  <Icon
                    name="business"
                    size={18}
                  />
                </span>

                <input
                  id="admin-email"
                  type="email"
                  placeholder="Enter your admin email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="username"
                  disabled={loading}
                />

              </div>

            </div>


            {/* PASSWORD */}
            <div className="login-field">

              <label htmlFor="admin-password">
                Password
              </label>

              <div className="login-input-wrapper">

                <span className="login-input-icon">
                  <Icon
                    name="settings"
                    size={18}
                  />
                </span>

                <input
                  id="admin-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>


            {/* ERROR */}
            {error && (
              <div className="login-error">

                <span className="login-error-icon">
                  !
                </span>

                <p>{error}</p>

              </div>
            )}


            {/* SIGN IN */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >

              <span>
                {loading
                  ? "Signing in..."
                  : "Sign In"}
              </span>

              {!loading && (
                <Icon
                  name="arrow"
                  size={18}
                />
              )}

            </button>


            {/* SECURITY */}
            <div className="login-security-note">

              <span className="login-security-icon">
                <Icon
                  name="settings"
                  size={14}
                />
              </span>

              <span>
                This area is restricted to authorized
                administrators only.
              </span>

            </div>

          </form>

        </div>

      </div>


      <p className="login-footer">
        ReviewQR • Secure Admin Access
      </p>

    </div>
  );
};

export default Login;