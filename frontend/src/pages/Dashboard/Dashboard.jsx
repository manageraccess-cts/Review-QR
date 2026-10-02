
import { useMemo } from "react";

import Icon from "../../components/Icon";
import StatCard from "../../components/StatCard";
import { useBusiness } from "../../context/BusinessContext";

import "./Dashboard.css";

/* Format business creation date */
const formatCreatedDate = (business) => {
  const rawDate =
    business.createdAt ||
    business.createdOn ||
    business.created_at ||
    business.created_on;

  if (!rawDate) return "—";

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return String(rawDate);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* Get business date for sorting */
const getBusinessDate = (business) => {
  const rawDate =
    business.createdAt ||
    business.createdOn ||
    business.created_at ||
    business.created_on;

  if (!rawDate) return 0;

  const timestamp = new Date(rawDate).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

/* Get consistent Active / Inactive status */
const getStatusInfo = (business) => {
  const rawStatus =
    business.status ??
    business.isActive ??
    business.active ??
    business.qrStatus;

  const normalizedStatus = String(rawStatus ?? "")
    .trim()
    .toLowerCase();

  const isActive =
    rawStatus === true ||
    rawStatus === 1 ||
    ["active", "enabled", "true", "1"].includes(
      normalizedStatus
    );

  return isActive
    ? {
        label: "Active",
        className: "dashboard-status-active",
      }
    : {
        label: "Inactive",
        className: "dashboard-status-inactive",
      };
};

const Dashboard = ({ onNavigate }) => {
  const { businesses, statistics } = useBusiness();

  /* Recent businesses */
  const recentBusinesses = useMemo(() => {
    return [...businesses]
      .sort((a, b) => getBusinessDate(b) - getBusinessDate(a))
      .slice(0, 5);
  }, [businesses]);

  /* Question count */
  const getQuestionCount = (business) => {
    return (
      business.selectedQuestions?.length ||
      business.questions ||
      0
    );
  };

  /* Dashboard stats */
  const totalBusinesses = statistics.total;
  const activeQrCodes = statistics.qrGenerated;
  const reviewsGenerated = statistics.reviewsGenerated;

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="dashboard-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your review QR generator</p>
        </div>
      </div>

      {/* Hero Banner */}
      <section
        className="dashboard-hero"
        style={{
          backgroundImage: "url('/hero-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="dashboard-hero-content">
          <span className="dashboard-hero-eyebrow">
            CREATE REVIEW QR
          </span>

          <h2>Create Review QR</h2>

          <p>
            Create a complete review experience for your
            business client.
          </p>

          <button
            type="button"
            className="dashboard-hero-button"
            onClick={() => onNavigate("create-business")}
          >
            <Icon name="plus" size={20} strokeWidth={2} />
            <span>Create New Business</span>
          </button>
        </div>
      </section>

      {/* Statistics Cards */}
      <div className="dashboard-stats-grid">
        <StatCard
          title="Total Businesses"
          value={totalBusinesses}
          description="Configured businesses"
          icon="business"
          iconClass="stat-icon-blue"
        />

        <StatCard
          title="Active QR Codes"
          value={activeQrCodes}
          description="Generated QR codes"
          icon="qr"
          iconClass="stat-icon-green"
        />

        <StatCard
          title="Reviews Generated"
          value={reviewsGenerated}
          description="Customer review sessions"
          icon="review"
          iconClass="stat-icon-purple"
        />
      </div>

      {/* Recent Businesses */}
      <div className="dashboard-content-grid">
        <section className="dashboard-recent-card">
          <div className="dashboard-section-header">
            <div>
              <h3>Recent Businesses</h3>
              <p>Recently configured businesses</p>
            </div>

            <button
              type="button"
              className="dashboard-view-all-button"
              onClick={() => onNavigate("businesses")}
            >
              View All
              <Icon name="arrow" size={14} />
            </button>
          </div>

          {recentBusinesses.length > 0 ? (
            <div className="dashboard-business-table-wrapper">
              <table className="dashboard-business-table">
                <thead>
                  <tr>
                    <th>BUSINESS</th>
                    <th>CATEGORY</th>
                    <th>QUESTIONS</th>
                    <th>STATUS</th>
                    <th>CREATED</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {recentBusinesses.map((business) => {
                    const questionCount =
                      getQuestionCount(business);

                    const totalQuestions =
                      business.totalQuestions || 6;

                    const progress = Math.min(
                      100,
                      (questionCount / totalQuestions) * 100
                    );

                    const statusInfo = getStatusInfo(business);

                    return (
                      <tr key={business.id}>
                        {/* Business */}
                        <td>
                          <div className="dashboard-business-name">
                            <div className="dashboard-business-avatar">
                              {business.name
                                ?.trim()
                                ?.charAt(0)
                                ?.toUpperCase() || "B"}
                            </div>

                            <div>
                              <strong>{business.name}</strong>
                              <span>{business.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          <span className="dashboard-category-badge">
                            {business.category || "General"}
                          </span>
                        </td>

                        {/* Questions */}
                        <td>
                          <div className="dashboard-question-count">
                            <strong>
                              {questionCount} / {totalQuestions}
                            </strong>

                            <div className="dashboard-question-progress">
                              <span
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            className={`dashboard-status-badge ${statusInfo.className}`}
                          >
                            <span className="dashboard-status-dot" />
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Created */}
                        <td>
                          <span className="dashboard-created-date">
                            {formatCreatedDate(business)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td>
                          <button
                            type="button"
                            className="dashboard-table-view-button"
                            onClick={() =>
                              onNavigate("businesses")
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <div className="dashboard-empty-icon">
                <Icon name="business" size={25} />
              </div>

              <h4>No businesses yet</h4>

              <p>
                Create your first business to start
                generating review QR experiences.
              </p>

              <button
                type="button"
                onClick={() => onNavigate("create-business")}
              >
                Create New Business
                <Icon name="arrow" size={14} />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;