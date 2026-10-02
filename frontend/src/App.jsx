
import { useEffect, useState } from "react";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import LogoutModal from "./components/LogoutModal";

import Dashboard from "./pages/Dashboard/Dashboard";
import Businesses from "./pages/Businesses/Businesses";
import CreateBusiness from "./pages/Businesses/CreateBusiness/CreateBusiness";
import Review from "./pages/Review/Review";
import Login from "./pages/Login/Login";
import Settings from "./pages/Settings";

import {
  getCurrentAdmin,
  isAuthenticated,
  logoutAdmin,
  checkBackend,
} from "./services/api";

import { BusinessProvider } from "./context/BusinessContext";
import { QuestionProvider } from "./context/QuestionContext";

import "./App.css";

/* =========================================
   PAGE URL CONFIGURATION
========================================= */

const pagePaths = {
  dashboard: "/dashboard",
  businesses: "/businesses",
  "create-business": "/create-business",
  settings: "/settings",
};

const getPageFromPath = (pathname) => {
  const normalizedPath =
    pathname.toLowerCase().replace(/\/+$/, "") || "/";

  const matchedPage = Object.entries(pagePaths).find(
    ([, path]) => path === normalizedPath
  );

  return matchedPage ? matchedPage[0] : "dashboard";
};

/* =========================================
   GET SAVED DARK MODE
========================================= */

function getSavedDarkMode() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("reviewqr-settings") || "{}"
    );

    return saved.darkMode === true;
  } catch (error) {
    console.error("Unable to load theme preference:", error);
    return false;
  }
}

/* =========================================
   APP
========================================= */

function App() {
  const isReviewPage = window.location.pathname
    .toLowerCase()
    .startsWith("/r/");

  const [activePage, setActivePage] = useState(() =>
    getPageFromPath(window.location.pathname)
  );

  const [authenticated, setAuthenticated] = useState(
    isAuthenticated()
  );

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [darkMode, setDarkMode] = useState(getSavedDarkMode);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  /* =========================================
     APPLY GLOBAL DARK MODE
  ========================================= */

  useEffect(() => {
    if (isReviewPage) {
      document.body.classList.remove("reviewqr-dark-mode");
      return;
    }

    document.body.classList.toggle(
      "reviewqr-dark-mode",
      darkMode
    );

    return () => {
      document.body.classList.remove("reviewqr-dark-mode");
    };
  }, [darkMode, isReviewPage]);

  /* =========================================
     CHECK ADMIN AUTHENTICATION
  ========================================= */

  useEffect(() => {
    if (isReviewPage) {
      setCheckingAuth(false);
      return;
    }

    let isMounted = true;

    const verifyAuthentication = async () => {
      if (!isAuthenticated()) {
        if (isMounted) {
          setAuthenticated(false);
          setCheckingAuth(false);
        }
        return;
      }

      try {
        await getCurrentAdmin();

        if (isMounted) {
          setAuthenticated(true);
        }
      } catch (error) {
        console.error(
          "Authentication check failed:",
          error.message
        );

        logoutAdmin();

        if (isMounted) {
          setAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    };

    verifyAuthentication();

    return () => {
      isMounted = false;
    };
  }, [isReviewPage]);

  /* =========================================
     SYNC URL WITH PAGE
  ========================================= */

  useEffect(() => {
    if (isReviewPage || checkingAuth || !authenticated) {
      return;
    }

    const currentPath =
      window.location.pathname.toLowerCase().replace(/\/+$/, "") || "/";

    const expectedPath = pagePaths[activePage] || "/dashboard";

    if (currentPath !== expectedPath) {
      window.history.replaceState(null, "", expectedPath);
    }
  }, [activePage, authenticated, checkingAuth, isReviewPage]);

  /* =========================================
     HANDLE BROWSER BACK / FORWARD
  ========================================= */

  useEffect(() => {
    if (isReviewPage) {
      return;
    }

    const handlePopState = () => {
      const nextPage = getPageFromPath(
        window.location.pathname
      );

      setActivePage(nextPage);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isReviewPage]);

  /* =========================================
     BACKEND CONNECTION CHECK
  ========================================= */

  useEffect(() => {
    if (isReviewPage || !authenticated || checkingAuth) {
      return;
    }

    const connectToBackend = async () => {
      try {
        const response = await checkBackend();
        console.log("✅ BACKEND CONNECTED:", response);
      } catch (error) {
        console.error(
          "❌ BACKEND CONNECTION FAILED:",
          error.message
        );
      }
    };

    connectToBackend();
  }, [isReviewPage, authenticated, checkingAuth]);

  /* =========================================
     LOGOUT CONFIRMATION HANDLERS
  ========================================= */

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);

    logoutAdmin();
    setAuthenticated(false);
    setActivePage("dashboard");

    window.history.replaceState(
      null,
      "",
      "/dashboard"
    );
  };

  /* =========================================
     PUBLIC CUSTOMER REVIEW PAGE
  ========================================= */

  if (isReviewPage) {
    return (
      <QuestionProvider>
        <Review />
      </QuestionProvider>
    );
  }

  /* =========================================
     AUTHENTICATION LOADING
  ========================================= */

  if (checkingAuth) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-card">
          <div className="auth-loading-logo">QR</div>
          <div className="auth-loading-spinner" />
          <p>Checking secure access...</p>
        </div>
      </div>
    );
  }

  /* =========================================
     LOGIN PAGE
  ========================================= */

  if (!authenticated) {
    return (
      <Login
        onLogin={() => {
          window.history.replaceState(
            null,
            "",
            "/dashboard"
          );

          setActivePage("dashboard");
          setAuthenticated(true);
        }}
      />
    );
  }

  /* =========================================
     NAVIGATION
  ========================================= */

  const handleNavigate = (page) => {
    // Open the same confirmation modal for all logout actions
    if (page === "logout") {
      setShowLogoutModal(true);
      return;
    }

    const nextPath = pagePaths[page];

    if (!nextPath) {
      return;
    }

    if (page !== activePage) {
      window.history.pushState(null, "", nextPath);
    }

    setActivePage(page);
  };

  /* =========================================
     PAGE TITLE
  ========================================= */

  const getPageTitle = () => {
    switch (activePage) {
      case "dashboard":
        return "Dashboard";

      case "businesses":
        return "Businesses";

      case "create-business":
        return "Create Business";

      case "settings":
        return "Settings";

      default:
        return "Dashboard";
    }
  };

  /* =========================================
     PAGE RENDER
  ========================================= */

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} />;

      case "businesses":
        return <Businesses onNavigate={handleNavigate} />;

      case "create-business":
        return (
          <CreateBusiness onNavigate={handleNavigate} />
        );

      case "settings":
        return (
          <Settings
            darkMode={darkMode}
            onDarkModeChange={setDarkMode}
          />
        );

      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  /* =========================================
     ADMIN APPLICATION
  ========================================= */

  return (
    <QuestionProvider>
      <BusinessProvider>
        <div className={`app ${darkMode ? "dark-mode" : ""}`}>
          <Sidebar
            activePage={activePage}
            onNavigate={handleNavigate}
          />

          <div className="app-main">
            <Topbar
              currentPage={getPageTitle()}
              onNavigate={handleNavigate}
            />

            <main className="page-content">
              {renderPage()}
            </main>
          </div>
        </div>

        {/* Custom logout confirmation modal */}
        {showLogoutModal && (
          <LogoutModal
            onCancel={cancelLogout}
            onConfirm={confirmLogout}
          />
        )}
      </BusinessProvider>
    </QuestionProvider>
  );
}

export default App;