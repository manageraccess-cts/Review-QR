import { useState } from "react";
import Icon from "./Icon";

const Sidebar = ({
  activePage = "dashboard",
  onNavigate,
}) => {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const handleNavigate = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }

    setMobileOpen(false);
  };

  return (
    <>
      {/* =========================================
          MOBILE MENU BUTTON
      ========================================= */}

      <button
        className="mobile-menu-button"
        onClick={() =>
          setMobileOpen(true)
        }
        aria-label="Open menu"
      >
        <Icon
          name="menu"
          size={22}
        />
      </button>

      {/* =========================================
          MOBILE OVERLAY
      ========================================= */}

      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}

      {/* =========================================
          SIDEBAR
      ========================================= */}

      <aside
        className={`sidebar ${
          mobileOpen
            ? "sidebar-open"
            : ""
        }`}
      >
        {/* =========================================
            LOGO
        ========================================= */}

        <div className="sidebar-logo">
          <div className="logo-icon">
            <Icon
              name="qr"
              size={24}
              strokeWidth={2}
            />
          </div>

          <div className="logo-text">
            <span className="logo-title">
              ReviewQR
            </span>

            <span className="logo-subtitle">
              Admin Panel
            </span>
          </div>

          <button
            className="sidebar-close"
            onClick={() =>
              setMobileOpen(false)
            }
            aria-label="Close menu"
          >
            <Icon
              name="close"
              size={20}
            />
          </button>
        </div>

        {/* =========================================
            MAIN NAVIGATION
        ========================================= */}

        <div className="sidebar-section">
          <p className="sidebar-section-title">
            MAIN
          </p>

          <nav className="sidebar-nav">
            {/* DASHBOARD */}

            <button
              className={`sidebar-nav-item ${
                activePage ===
                "dashboard"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigate(
                  "dashboard"
                )
              }
            >
              <Icon
                name="dashboard"
                size={19}
              />

              <span>
                Dashboard
              </span>
            </button>

            {/* BUSINESSES */}

            <button
              className={`sidebar-nav-item ${
                activePage ===
                "businesses"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigate(
                  "businesses"
                )
              }
            >
              <Icon
                name="business"
                size={19}
              />

              <span>
                Businesses
              </span>
            </button>
          </nav>
        </div>

        {/* =========================================
            SYSTEM
        ========================================= */}

        <div className="sidebar-section sidebar-system">
          <p className="sidebar-section-title">
            SYSTEM
          </p>

          <nav className="sidebar-nav">
            {/* SETTINGS */}

            <button
              className={`sidebar-nav-item ${
                activePage ===
                "settings"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigate(
                  "settings"
                )
              }
            >
              <Icon
                name="settings"
                size={19}
              />

              <span>
                Settings
              </span>
            </button>

            {/* LOGOUT */}

            <button
              className="sidebar-nav-item"
              onClick={() =>
                handleNavigate(
                  "logout"
                )
              }
            >
              <Icon
                name="logout"
                size={19}
              />

              <span>
                Logout
              </span>
            </button>
          </nav>
        </div>

        {/* =========================================
            ADMIN PROFILE
        ========================================= */}

        <div className="sidebar-profile">
          <div className="profile-avatar">
            A
          </div>

          <div className="profile-info">
            <span className="profile-name">
              Admin
            </span>

            <span className="profile-role">
              Administrator
            </span>
          </div>

          <span className="profile-status" />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;