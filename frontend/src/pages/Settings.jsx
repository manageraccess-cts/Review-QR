import { useEffect, useRef, useState } from "react";
import "./Settings.css";
import {
  getCurrentAdmin,
  changeAdminPassword,
  logoutAdmin,
} from "../services/api";

const defaultPreferences = {
  emailNotifications: true,
  darkMode: false,
};

function readPreferences() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("reviewqr-settings") || "{}"
    );
    return { ...defaultPreferences, ...saved };
  } catch {
    return { ...defaultPreferences };
  }
}

function readProfilePhoto() {
  try {
    return localStorage.getItem("reviewqr-admin-photo") || "";
  } catch {
    return "";
  }
}

export default function Settings({ darkMode = false, onDarkModeChange }) {
  const [admin, setAdmin] = useState({
    name: "Admin",
    email: "",
    role: "Administrator",
  });

  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState(readPreferences);
  const [profilePhoto, setProfilePhoto] = useState(readProfilePhoto);
  const fileInputRef = useRef(null);

  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [visible, setVisible] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const [passwordMessage, setPasswordMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [photoMessage, setPhotoMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAdmin() {
      try {
        const response = await getCurrentAdmin();
        const data =
          response?.admin ||
          response?.data?.admin ||
          response?.data ||
          response;

        if (active && data) {
          setAdmin({
            name:
              data.name ||
              data.username ||
              data.fullName ||
              "Admin",
            email: data.email || "",
            role: data.role || "Administrator",
          });
        }
      } catch (error) {
        console.error("Unable to load admin profile:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAdmin();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("reviewqr-settings", JSON.stringify(preferences));
    } catch (error) {
      console.warn("Unable to save settings preferences:", error);
    }
  }, [preferences]);

  // Restore a previously saved preference in the app shell on page load.
  useEffect(() => {
    if (preferences.darkMode) {
      onDarkModeChange?.(true);
    }
    // The callback is intentionally invoked only on initial preference restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatePreference = (key) => {
    setPreferences((previous) => {
      const updated = {
        ...previous,
        [key]: !previous[key],
      };

      if (key === "darkMode") {
        onDarkModeChange?.(updated.darkMode);
      }

      return updated;
    });
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoMessage("");

    if (!file.type.startsWith("image/")) {
      setPhotoMessage("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoMessage("Choose an image smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = String(reader.result || "");
      try {
        localStorage.setItem("reviewqr-admin-photo", imageData);
        setProfilePhoto(imageData);
        setPhotoMessage("Profile photo updated on this device.");
      } catch (error) {
        console.error("Unable to save profile photo:", error);
        setPhotoMessage("Unable to save this photo. Try a smaller image.");
      }
      event.target.value = "";
    };
    reader.onerror = () => {
      setPhotoMessage("Unable to read this image. Please try another.");
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const removeProfilePhoto = () => {
    try {
      localStorage.removeItem("reviewqr-admin-photo");
      setProfilePhoto("");
      setPhotoMessage("Profile photo removed.");
    } catch (error) {
      console.error("Unable to remove profile photo:", error);
      setPhotoMessage("Unable to remove the profile photo.");
    }
  };

  const updatePasswordField = (key, value) => {
    setPasswords((previous) => ({
      ...previous,
      [key]: value,
    }));
    setPasswordMessage("");
    setMessageType("");
  };

  const toggleVisibility = (key) => {
    setVisible((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordMessage("");
    setMessageType("");

    const { current, next, confirm } = passwords;

    if (!current || !next || !confirm) {
      setPasswordMessage("Please fill in all password fields.");
      setMessageType("error");
      return;
    }

    if (next.length < 8) {
      setPasswordMessage(
        "New password must contain at least 8 characters."
      );
      setMessageType("error");
      return;
    }

    if (next !== confirm) {
      setPasswordMessage("New password and confirmation do not match.");
      setMessageType("error");
      return;
    }

    if (current === next) {
      setPasswordMessage(
        "New password must be different from the current password."
      );
      setMessageType("error");
      return;
    }

    try {
      setUpdatingPassword(true);
      const response = await changeAdminPassword(current, next);

      setPasswordMessage(
        response.message ||
          "Password updated successfully. Please sign in again."
      );
      setMessageType("success");
      setPasswords({ current: "", next: "", confirm: "" });

      // Preserve the existing sign-out behavior after password change.
      logoutAdmin();
      setTimeout(() => {
        window.location.reload();
      }, 1400);
    } catch (error) {
      setPasswordMessage(error.message || "Unable to update password.");
      setMessageType("error");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <main className="settings-page">
      <div className="settings-heading">
        <div>
          <h1>Settings</h1>
          <p>Manage your account and application preferences.</p>
        </div>
      </div>

      <div className="settings-top-grid">
        {/* PROFILE INFORMATION */}
        <section className="settings-card profile-card">
          <div className="settings-card-heading">
            <div className="settings-heading-icon profile-heading-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" fill="currentColor" />
                <path d="M4.5 20a7.5 7.5 0 0 1 15 0v1h-15v-1Z" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h2>Profile Information</h2>
              <p>Your admin account details.</p>
            </div>
          </div>

          <div className="profile-content">
            <div className="profile-avatar-column">
              <div className="profile-avatar-wrap">
                {profilePhoto ? (
                  <img className="profile-avatar-image" src={profilePhoto} alt="Admin profile" />
                ) : (
                  <div className="profile-avatar">
                    {(admin.name?.trim()?.charAt(0) || "A").toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  className="profile-photo-button"
                  aria-label="Change profile photo"
                  title="Change profile photo"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 8.5h3l1.5-2h7L17 8.5h3v10H4v-10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </button>
              </div>
              <input
                ref={fileInputRef}
                className="profile-photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                aria-label="Choose profile photo"
              />
              {profilePhoto && (
                <button type="button" className="remove-photo-button" onClick={removeProfilePhoto}>
                  Remove photo
                </button>
              )}
              {photoMessage && <p className="photo-message" role="status">{photoMessage}</p>}
            </div>

            <div className="profile-fields">
              <div className="settings-field">
                <label htmlFor="admin-name">Name</label>
                <input
                  id="admin-name"
                  type="text"
                  value={loading ? "Loading..." : admin.name}
                  readOnly
                />
              </div>

              <div className="settings-field">
                <label htmlFor="admin-email">Email</label>
                <input
                  id="admin-email"
                  type="email"
                  value={loading ? "Loading..." : admin.email || "Not available"}
                  readOnly
                  className="readonly-field"
                />
              </div>

              <div className="settings-field">
                <label htmlFor="admin-role">Role</label>
                <input
                  id="admin-role"
                  type="text"
                  value={admin.role}
                  readOnly
                  className="readonly-field"
                />
              </div>
            </div>
          </div>
        </section>

        {/* APPLICATION PREFERENCES */}
        <section className="settings-card preferences-card">
          <div className="settings-card-heading">
            <div className="settings-heading-icon preferences-heading-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" stroke="currentColor" strokeWidth="2" />
                <path d="m19.4 13.5 1.1.8-1.8 3.1-1.3-.5a7.9 7.9 0 0 1-1.7 1l-.2 1.4h-3.6l-.2-1.4a7.9 7.9 0 0 1-1.7-1l-1.3.5-1.8-3.1 1.1-.8a7.5 7.5 0 0 1 0-2l-1.1-.8 1.8-3.1 1.3.5a7.9 7.9 0 0 1 1.7-1l.2-1.4h3.6l.2 1.4a7.9 7.9 0 0 1 1.7 1l1.3-.5 1.8 3.1-1.1.8a7.5 7.5 0 0 1 0 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h2>Application Preferences</h2>
              <p>Customize your application experience.</p>
            </div>
          </div>

          <div className="preference-row">
            <div className="preference-icon email-preference-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3.5 6.5h17v12h-17v-12Z" fill="currentColor" />
                <path d="m4.5 7.5 7.5 6 7.5-6" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="preference-copy">
              <h3>Email Notifications</h3>
              <p>Receive email notifications about important updates, new reviews and system alerts.</p>
            </div>
            <button
              type="button"
              className={`settings-switch ${preferences.emailNotifications ? "is-on" : ""}`}
              role="switch"
              aria-checked={preferences.emailNotifications}
              aria-label="Email notifications"
              onClick={() => updatePreference("emailNotifications")}
            >
              <span />
            </button>
          </div>

          <div className="preference-row">
            <div className="preference-icon dark-preference-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M19.8 15.2A8.5 8.5 0 0 1 8.8 4.2 8.5 8.5 0 1 0 19.8 15.2Z" fill="currentColor" />
              </svg>
            </div>
            <div className="preference-copy">
              <h3>Dark Mode</h3>
              <p>Switch to dark mode for a more comfortable viewing experience.</p>
            </div>
            <button
              type="button"
              className={`settings-switch ${darkMode ? "is-on" : ""}`}
              role="switch"
              aria-checked={darkMode}
              aria-label="Dark mode"
              onClick={() => updatePreference("darkMode")}
            >
              <span />
            </button>
          </div>
        </section>
      </div>

      {/* CHANGE PASSWORD */}
      <section className="settings-card password-card">
        <div className="settings-card-heading">
          <div className="settings-heading-icon password-heading-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="5" y="10" width="14" height="11" rx="2" fill="currentColor" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="12" cy="15" r="1.3" fill="#fff" />
              <path d="M12 16v2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h2>Change Password</h2>
            <p>Update your account password to keep your account secure.</p>
          </div>
        </div>

        <form className="password-form" onSubmit={handlePasswordSubmit}>
          {[
            {
              key: "current",
              label: "Current Password",
              placeholder: "Enter current password",
              autoComplete: "current-password",
            },
            {
              key: "next",
              label: "New Password",
              placeholder: "Enter new password",
              autoComplete: "new-password",
            },
            {
              key: "confirm",
              label: "Confirm New Password",
              placeholder: "Confirm new password",
              autoComplete: "new-password",
            },
          ].map((field) => (
            <div className="settings-field" key={field.key}>
              <label htmlFor={`password-${field.key}`}>{field.label}</label>
              <div className="password-input-wrap">
                <input
                  id={`password-${field.key}`}
                  type={visible[field.key] ? "text" : "password"}
                  value={passwords[field.key]}
                  onChange={(event) =>
                    updatePasswordField(field.key, event.target.value)
                  }
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  disabled={updatingPassword}
                />
                <button
                  type="button"
                  className="password-visibility"
                  onClick={() => toggleVisibility(field.key)}
                  aria-label={visible[field.key] ? "Hide password" : "Show password"}
                  disabled={updatingPassword}
                >
                  {visible[field.key] ? (
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M3 3 21 21M10.6 10.6a2 2 0 0 0 2.8 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9 7 9 7a16 16 0 0 1-3 3.8M6.2 6.2C4.1 7.6 3 12 3 12s3.5 7 9 7c1.1 0 2.1-.2 3-.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M2.8 12s3.4-7 9.2-7 9.2 7 9.2 7-3.4 7-9.2 7-9.2-7-9.2-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}

          <div className="password-actions">
            <button className="settings-primary-btn" type="submit" disabled={updatingPassword}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              {updatingPassword ? "Updating..." : "Update Password"}
            </button>
            {passwordMessage && (
              <p className={`settings-message ${messageType}`} role="status">
                {passwordMessage}
              </p>
            )}
          </div>
        </form>

        <p className="password-note">
          <span className="password-note-icon" aria-hidden="true">i</span>
          After changing your password, you will be signed out and need to sign in again.
        </p>
      </section>
    </main>
  );
}
