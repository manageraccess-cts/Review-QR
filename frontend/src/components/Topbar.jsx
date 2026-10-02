
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import {
  getCurrentAdmin,
  getReviewActivity,
} from "../services/api";
import "./Topbar.css";

const Topbar = ({ currentPage = "Dashboard", onNavigate }) => {
  const [admin, setAdmin] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const topbarRef = useRef(null);

  // Load logged-in admin details
  useEffect(() => {
    let mounted = true;

    const loadAdmin = async () => {
      try {
        const response = await getCurrentAdmin();

        if (!mounted) return;

        const details =
          response?.data?.admin ||
          response?.data?.user ||
          response?.admin ||
          response?.user ||
          response?.data ||
          {};

        setAdmin(details);
      } catch (error) {
        console.error("Unable to load admin profile:", error);
      }
    };

    loadAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  // Close dropdowns when clicking outside the topbar menus
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        topbarRef.current &&
        !topbarRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
        setShowProfile(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Fetch recent review activity
  const loadNotifications = async () => {
    setLoadingNotifications(true);
    setNotificationError("");

    try {
      const response = await getReviewActivity();

      const activities = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.activities)
        ? response.data.activities
        : Array.isArray(response?.activities)
        ? response.activities
        : [];

      setNotifications(activities);
    } catch (error) {
      console.error("Unable to load notifications:", error);
      setNotificationError("Unable to load recent activity.");
    } finally {
      setLoadingNotifications(false);
    }
  };

  const toggleNotifications = async () => {
    const shouldOpen = !showNotifications;

    setShowNotifications(shouldOpen);
    setShowProfile(false);

    if (shouldOpen) {
      await loadNotifications();
    }
  };

  const toggleProfile = () => {
    setShowProfile((current) => !current);
    setShowNotifications(false);
  };

  // Dismiss one notification from the current UI session
  const dismissNotification = (activity, index) => {
    const id = String(
      activity?._id ||
        activity?.id ||
        `${activity?.businessId || "activity"}-${index}`
    );

    setDismissedIds((current) =>
      current.includes(id) ? current : [...current, id]
    );
  };

  // Open the shared logout confirmation modal in App.jsx
  const handleLogout = () => {
    setShowProfile(false);

    if (typeof onNavigate === "function") {
      onNavigate("logout");
    } else {
      console.error(
        "Logout navigation handler is missing. Pass onNavigate from App.jsx."
      );
    }
  };

  const adminName =
    admin?.name ||
    admin?.fullName ||
    admin?.username ||
    admin?.email?.split("@")[0] ||
    "Admin";

  const initials =
    adminName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "A";

  const getActivityText = (activity) => {
    const event = String(activity?.event || "").toLowerCase();
    const businessName =
      activity?.businessName ||
      activity?.business?.name ||
      "a business";

    if (event === "started") {
      return `A customer started a review for ${businessName}.`;
    }

    if (event.includes("generated")) {
      return `A review was generated for ${businessName}.`;
    }

    if (event.includes("completed") || event.includes("submitted")) {
      return `A review session was completed for ${businessName}.`;
    }

    return `Review activity recorded for ${businessName}.`;
  };

  const formatActivityDate = (date) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "";

    return parsed.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const visibleNotifications = notifications
    .map((activity, index) => ({
      activity,
      index,
      id: String(
        activity?._id ||
          activity?.id ||
          `${activity?.businessId || "activity"}-${index}`
      ),
    }))
    .filter(({ id }) => !dismissedIds.includes(id))
    .slice(0, 10);

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Admin</span>
        <span className="breadcrumb-separator">/</span>
        <strong>{currentPage}</strong>
      </div>

      <div className="topbar-right" ref={topbarRef}>
        {/* Notifications */}
        <div className="topbar-menu-wrapper">
          <button
            className={`notification-button ${
              showNotifications ? "menu-active" : ""
            }`}
            aria-label="Notifications"
            aria-expanded={showNotifications}
            type="button"
            onClick={toggleNotifications}
          >
            <Icon name="bell" size={20} />
            {visibleNotifications.length > 0 && (
              <span className="notification-dot" />
            )}
          </button>

          {showNotifications && (
            <div className="topbar-dropdown notification-dropdown">
              <div className="dropdown-heading">
                <div>
                  <h3>Notifications</h3>
                  <p>Recent review activity</p>
                </div>

                <button
                  type="button"
                  className="dropdown-close"
                  onClick={() => setShowNotifications(false)}
                  aria-label="Close notifications"
                >
                  ×
                </button>
              </div>

              {loadingNotifications ? (
                <div className="dropdown-empty">
                  <div className="loading-spinner" />
                  <p>Loading activity...</p>
                </div>
              ) : notificationError ? (
                <div className="dropdown-empty">
                  <p>{notificationError}</p>
                  <button type="button" onClick={loadNotifications}>
                    Try again
                  </button>
                </div>
              ) : visibleNotifications.length === 0 ? (
                <div className="dropdown-empty">
                  <div className="dropdown-empty-icon">
                    <Icon name="bell" size={22} />
                  </div>
                  <strong>No recent activity</strong>
                  <p>New review activity will appear here.</p>
                </div>
              ) : (
                <div className="notification-list">
                  {visibleNotifications.map(
                    ({ activity, index, id }) => (
                      <div className="notification-item" key={id}>
                        <div className="notification-item-icon">
                          <Icon name="review" size={16} />
                        </div>

                        <div className="notification-item-content">
                          <p>{getActivityText(activity)}</p>
                          <span>
                            {formatActivityDate(
                              activity.createdAt || activity.timestamp
                            )}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="notification-dismiss"
                          aria-label="Dismiss notification"
                          title="Dismiss"
                          onClick={() =>
                            dismissNotification(activity, index)
                          }
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}

              <div className="dropdown-footer">
                <button
                  type="button"
                  onClick={loadNotifications}
                  disabled={loadingNotifications}
                >
                  <Icon name="refresh" size={14} />
                  Refresh activity
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile */}
        <div className="topbar-menu-wrapper">
          <button
            className="topbar-profile"
            type="button"
            onClick={toggleProfile}
            aria-expanded={showProfile}
          >
            <div className="topbar-avatar">{initials}</div>
            <span className="topbar-admin-name">{adminName}</span>
          </button>

          {showProfile && (
            <div className="topbar-dropdown profile-dropdown">
              <div className="profile-dropdown-info">
                <div className="topbar-avatar profile-large-avatar">
                  {initials}
                </div>

                <div className="profile-text">
                  <strong>{adminName}</strong>
                  <span>{admin?.email || "Administrator"}</span>
                  <small>Administrator</small>
                </div>
              </div>

              <div className="profile-dropdown-divider" />

              <button
                className="profile-menu-item"
                type="button"
                onClick={handleLogout}
              >
                <Icon name="logout" size={17} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;