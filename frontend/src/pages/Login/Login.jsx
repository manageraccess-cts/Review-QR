
import { useEffect, useState } from "react";

import Icon from "../../components/Icon";

import {
  loginAdmin,
  forgotAdminPassword,
  verifyAdminResetOtp,
  resetAdminPassword,
} from "../../services/api";

import "./Login.css";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Password reset states
  const [authMode, setAuthMode] = useState("login");
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSeconds, setOtpSeconds] = useState(60);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // One-minute countdown for OTP validity
  useEffect(() => {
    if (
      (authMode !== "otp" && authMode !== "reset") ||
      otpSeconds <= 0
    ) {
      if (authMode === "reset" && otpSeconds <= 0) {
        setAuthMode("otp");
        setNewPassword("");
        setConfirmPassword("");
        setSuccessMessage("");
        setError("OTP expired. Please request a new OTP.");
      }

      return;
    }

    const timer = setTimeout(() => {
      setOtpSeconds((seconds) => seconds - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [authMode, otpSeconds]);

  // Normal admin login - unchanged
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

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

  // Send OTP
  const handleForgotPassword = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!resetEmail.trim()) {
      setError("Please enter your admin email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await forgotAdminPassword(
        resetEmail.trim()
      );

      setOtp("");
      setOtpSeconds(60);
      setNewPassword("");
      setConfirmPassword("");
      setAuthMode("otp");

      setSuccessMessage(
        response.message ||
          "If the email matches the admin account, an OTP will be sent."
      );
    } catch (err) {
      setError(err.message || "Unable to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP after expiry
  const handleResendOtp = async () => {
    setError("");
    setSuccessMessage("");

    try {
      setLoading(true);

      const response = await forgotAdminPassword(
        resetEmail.trim()
      );

      setOtp("");
      setOtpSeconds(60);
      setAuthMode("otp");

      setSuccessMessage(
        response.message || "A new OTP has been requested."
      );
    } catch (err) {
      setError(err.message || "Unable to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP before showing password fields
  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (otpSeconds <= 0) {
      setError("OTP expired. Please request a new OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const response = await verifyAdminResetOtp(
        resetEmail.trim(),
        otp.trim()
      );

      if (!response.success) {
        throw new Error(response.message || "OTP verification failed.");
      }

      setAuthMode("reset");
      setSuccessMessage("OTP verified. Enter your new password.");
    } catch (err) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset password after successful OTP verification
  const handleResetPassword = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (otpSeconds <= 0) {
      setAuthMode("otp");
      setError("OTP expired. Please request a new OTP.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await resetAdminPassword(
        resetEmail.trim(),
        newPassword
      );

      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
      setOtpSeconds(60);

      setAuthMode("login");
      setSuccessMessage(
        response.message ||
          "Password reset successfully. Please sign in."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to reset password. Please verify your OTP or request a new one."
      );
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    setResetEmail(email);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setOtpSeconds(60);
    setError("");
    setSuccessMessage("");
    setAuthMode("forgot");
  };

  const backToLogin = () => {
    setError("");
    setSuccessMessage("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setAuthMode("login");
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
          {authMode === "login" && (
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label htmlFor="admin-email">
                  Email address
                </label>

                <div className="login-input-wrapper">
                  <span className="login-input-icon">
                    <Icon name="business" size={18} />
                  </span>

                  <input
                    id="admin-email"
                    type="email"
                    placeholder="Enter your admin email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="admin-password">
                  Password
                </label>

                <div className="login-input-wrapper">
                  <span className="login-input-icon">
                    <Icon name="settings" size={18} />
                  </span>

                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />

                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    disabled={loading}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="login-forgot-password">
                <button
                  type="button"
                  onClick={openForgotPassword}
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="login-error">
                  <span className="login-error-icon">!</span>
                  <p>{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="login-success">
                  <p>{successMessage}</p>
                </div>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                <span>{loading ? "Signing in..." : "Sign In"}</span>

                {!loading && <Icon name="arrow" size={18} />}
              </button>

              <div className="login-security-note">
                <span className="login-security-icon">
                  <Icon name="settings" size={14} />
                </span>

                <span>
                  This area is restricted to authorized administrators only.
                </span>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD - EMAIL */}
          {authMode === "forgot" && (
            <form
              className="login-form"
              onSubmit={handleForgotPassword}
            >
              <div className="login-field">
                <label htmlFor="reset-email">
                  Admin email address
                </label>

                <div className="login-input-wrapper">
                  <span className="login-input-icon">
                    <Icon name="business" size={18} />
                  </span>

                  <input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your admin email"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    autoComplete="email"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="login-error">
                  <span className="login-error-icon">!</span>
                  <p>{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="login-success">
                  <p>{successMessage}</p>
                </div>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                <span>{loading ? "Sending..." : "Send OTP"}</span>

                {!loading && <Icon name="arrow" size={18} />}
              </button>

              <button
                type="button"
                className="login-back-button"
                onClick={backToLogin}
                disabled={loading}
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* VERIFY OTP */}
          {authMode === "otp" && (
            <form
              className="login-form"
              onSubmit={handleVerifyOtp}
            >
              <div className="login-field">
                <label htmlFor="reset-otp">
                  Enter 6-digit OTP
                </label>

                <div className="login-input-wrapper">
                  <span className="login-input-icon">
                    <Icon name="settings" size={18} />
                  </span>

                  <input
                    id="reset-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    disabled={loading || otpSeconds <= 0}
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <p>
                {otpSeconds > 0
                  ? `OTP expires in ${otpSeconds} seconds.`
                  : "Your OTP has expired."}
              </p>

              {error && (
                <div className="login-error">
                  <span className="login-error-icon">!</span>
                  <p>{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="login-success">
                  <p>{successMessage}</p>
                </div>
              )}

              {otpSeconds > 0 ? (
                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  <span>
                    {loading ? "Verifying..." : "Verify OTP"}
                  </span>

                  {!loading && <Icon name="arrow" size={18} />}
                </button>
              ) : (
                <button
                  type="button"
                  className="login-button"
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  <span>{loading ? "Resending..." : "Resend OTP"}</span>
                </button>
              )}

              <button
                type="button"
                className="login-back-button"
                onClick={backToLogin}
                disabled={loading}
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* NEW PASSWORD - ONLY AFTER OTP VERIFICATION */}
          {authMode === "reset" && (
            <form
              className="login-form"
              onSubmit={handleResetPassword}
            >
              <div className="login-field">
                <label htmlFor="new-admin-password">
                  New password
                </label>

                <div className="login-input-wrapper">
                  <span className="login-input-icon">
                    <Icon name="settings" size={18} />
                  </span>

                  <input
                    id="new-admin-password"
                    type="password"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="confirm-admin-password">
                  Confirm new password
                </label>

                <div className="login-input-wrapper">
                  <span className="login-input-icon">
                    <Icon name="settings" size={18} />
                  </span>

                  <input
                    id="confirm-admin-password"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <p>OTP expires in {otpSeconds} seconds.</p>

              {error && (
                <div className="login-error">
                  <span className="login-error-icon">!</span>
                  <p>{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="login-success">
                  <p>{successMessage}</p>
                </div>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={loading || otpSeconds <= 0}
              >
                <span>
                  {loading ? "Resetting..." : "Reset Password"}
                </span>

                {!loading && <Icon name="arrow" size={18} />}
              </button>

              <button
                type="button"
                className="login-back-button"
                onClick={backToLogin}
                disabled={loading}
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="login-footer">
        ReviewQR • Secure Admin Access
      </p>
    </div>
  );
};

export default Login;
