
import { useMemo, useState } from "react";

import Icon from "../../components/Icon";
import StatusBadge from "../../components/StatusBadge";
import { useBusiness } from "../../context/BusinessContext";
import { QRCodeSVG } from "qrcode.react";

import "./Businesses.css";

const Businesses = ({ onNavigate }) => {
  const {
    businesses,
    loading,
    error,
    statistics,
    removeBusiness,
    refreshBusinesses,
    fetchBusiness,
    updateBusiness,
  } = useBusiness();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deletingId, setDeletingId] = useState(null);

  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [modalMode, setModalMode] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [editForm, setEditForm] = useState({});

  /* =========================================
     FILTER BUSINESSES
  ========================================= */

  const filteredBusinesses = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return businesses.filter((business) => {
      const matchesSearch =
        !searchValue ||
        business.name?.toLowerCase().includes(searchValue) ||
        business.category?.toLowerCase().includes(searchValue) ||
        business.address?.toLowerCase().includes(searchValue) ||
        business.id?.toLowerCase().includes(searchValue);

      const matchesCategory =
        categoryFilter === "All" ||
        business.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" ||
        business.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [businesses, search, categoryFilter, statusFilter]);

  /* =========================================
     CATEGORIES
  ========================================= */

  const categories = useMemo(() => {
    return [
      ...new Set(
        businesses
          .map((business) => business.category)
          .filter(Boolean)
      ),
    ];
  }, [businesses]);

  /* =========================================
     FORMAT DATE
  ========================================= */

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(date);
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================================
     QUESTIONS COUNT
  ========================================= */

  const getQuestionCount = (business) => {
    if (Array.isArray(business.selectedQuestions)) {
      return business.selectedQuestions.length;
    }

    return Number(business.questionsCount || 0);
  };

  /* =========================================
     DOWNLOAD BUSINESS QR
  ========================================= */

  const downloadBusinessQR = (business) => {
    const svg = document.getElementById(
      `business-qr-${business.id}`
    );

    if (!svg) return;

    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${(business.name || "business")
      .trim()
      .replace(/[^a-z0-9-_]/gi, "-")}-review-qr.svg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* =========================================
     PRINT BUSINESS QR
  ========================================= */

  const printBusinessQR = (business) => {
    const svg = document.getElementById(
      `business-qr-${business.id}`
    );

    if (!svg) return;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      window.alert("Please allow pop-ups to print the QR code.");
      return;
    }

    const svgMarkup = new XMLSerializer().serializeToString(svg);
    const safeName = String(business.name || "Business")
      .replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]);

    printWindow.document.write(`<!DOCTYPE html>
      <html>
        <head>
          <title>${safeName} Review QR</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 16px;
              font-family: Arial, sans-serif;
              text-align: center;
              color: #17233e;
            }
            svg { width: 260px; height: 260px; }
            p { margin: 0; }
            @media print {
              body { min-height: auto; padding: 24px; }
            }
          </style>
        </head>
        <body>
          <h2>${safeName}</h2>
          ${svgMarkup}
          <p>Scan to write a review</p>
          <script>
            window.onload = function () {
              window.print();
            };
          <\/script>
        </body>
      </html>`);
    printWindow.document.close();
  };

  /* =========================================
     DELETE
  ========================================= */

  const handleDelete = async (business) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${business.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(business.id);
      await removeBusiness(business.id);
    } catch (err) {
      console.error("Delete failed:", err);
      window.alert(err.message || "Failed to delete business.");
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================================
     REFRESH
  ========================================= */

  const handleRefresh = async () => {
    try {
      await refreshBusinesses();
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  };

  /* =========================================
     OPEN VIEW MODAL
  ========================================= */

  const handleView = async (business) => {
    setSelectedBusiness(business);
    setModalMode("view");
    setModalLoading(true);
    setModalError("");

    try {
      const latestBusiness = await fetchBusiness(business.id);
      setSelectedBusiness(latestBusiness);
    } catch (err) {
      console.error("Failed to fetch business:", err);
      setModalError(err.message || "Unable to load business details.");
    } finally {
      setModalLoading(false);
    }
  };


  /* =========================================
     OPEN QR CODE VIEW
  ========================================= */

  const handleViewQR = async (business) => {
    setSelectedBusiness(business);
    setModalMode("qr");
    setModalLoading(true);
    setModalError("");

    try {
      const latestBusiness = await fetchBusiness(business.id);
      setSelectedBusiness(latestBusiness);
    } catch (err) {
      console.error("Failed to fetch business QR:", err);
      setModalError(err.message || "Unable to load QR code.");
    } finally {
      setModalLoading(false);
    }
  };

  const getBusinessReviewUrl = (business) =>
    `${window.location.origin}/r/${encodeURIComponent(business.id)}`;

  const copyBusinessReviewUrl = async (business) => {
    try {
      await navigator.clipboard.writeText(getBusinessReviewUrl(business));
      window.alert("Review URL copied to clipboard.");
    } catch (err) {
      console.error("Unable to copy review URL:", err);
      window.alert("Unable to copy URL. Please copy it manually.");
    }
  };

  /* =========================================
     OPEN EDIT MODAL
  ========================================= */

  const handleEdit = async (business) => {
    setSelectedBusiness(business);
    setModalMode("edit");
    setModalLoading(true);
    setModalError("");

    try {
      const latestBusiness = await fetchBusiness(business.id);

      setSelectedBusiness(latestBusiness);

      setEditForm({
        ...latestBusiness,
        name: latestBusiness.name || "",
        category: latestBusiness.category || "",
        phone: latestBusiness.phone || "",
        address: latestBusiness.address || "",
        googleReviewUrl: latestBusiness.googleReviewUrl || "",
        status: latestBusiness.status || "Active",
      });
    } catch (err) {
      console.error("Failed to fetch business:", err);
      setModalError(err.message || "Unable to load business for editing.");
    } finally {
      setModalLoading(false);
    }
  };

  /* =========================================
     EDIT FORM CHANGE
  ========================================= */

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /* =========================================
     SAVE BUSINESS
  ========================================= */

  const handleSave = async (event) => {
    event.preventDefault();

    if (
      !editForm.name?.trim() ||
      !editForm.category?.trim() ||
      !editForm.phone?.trim() ||
      !editForm.address?.trim() ||
      !editForm.googleReviewUrl?.trim()
    ) {
      setModalError("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      setModalError("");

      // Preserve the existing business configuration, including
      // selected questions and QR-related fields.
      const businessData = {
        ...selectedBusiness,
        ...editForm,
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        phone: editForm.phone.trim(),
        address: editForm.address.trim(),
        googleReviewUrl: editForm.googleReviewUrl.trim(),
      };

      const updatedBusiness = await updateBusiness(
        selectedBusiness.id,
        businessData
      );

      setSelectedBusiness(updatedBusiness);
      setModalMode("view");
    } catch (err) {
      console.error("Update failed:", err);
      setModalError(err.message || "Failed to update business.");
    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     CLOSE MODAL
  ========================================= */

  const closeModal = () => {
    if (saving) return;

    setSelectedBusiness(null);
    setModalMode("");
    setModalLoading(false);
    setModalError("");
    setEditForm({});
  };

  /* =========================================
     SWITCH FROM VIEW TO EDIT
  ========================================= */

  const switchToEdit = () => {
    if (!selectedBusiness) return;

    setEditForm({
      ...selectedBusiness,
      name: selectedBusiness.name || "",
      category: selectedBusiness.category || "",
      phone: selectedBusiness.phone || "",
      address: selectedBusiness.address || "",
      googleReviewUrl: selectedBusiness.googleReviewUrl || "",
      status: selectedBusiness.status || "Active",
    });

    setModalError("");
    setModalMode("edit");
  };

  const hasFilters =
    search || categoryFilter !== "All" || statusFilter !== "All";

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div className="businesses-page">
        <div className="businesses-loading">
          <div className="loading-spinner" />
          <p>Loading businesses...</p>
        </div>
      </div>
    );
  }

  /* =========================================
     PAGE
  ========================================= */

  return (
    <div className="businesses-page">
      {/* PAGE HEADER */}

      <section className="businesses-header">
        <div className="businesses-hero-content">
          <p className="page-eyebrow">BUSINESS MANAGEMENT</p>
          <h1>Business Directory</h1>
          <p className="businesses-subtitle">
            Manage your business clients and their review QR experiences.
          </p>
        </div>
      </section>

      {/* ERROR */}

      {error && (
        <div className="business-error">
          <div>
            <strong>Unable to load businesses</strong>
            <span>{error}</span>
          </div>

          <button onClick={handleRefresh} type="button">
            Try Again
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}

      <section className="business-overview-strip">
        <div className="business-summary-grid">
        <div className="business-summary-card">
          <div className="summary-icon summary-icon-blue">
            <Icon name="business" size={19} />
          </div>
          <div>
            <p>Total Businesses</p>
            <h3>{statistics.total}</h3>
          </div>
        </div>

        <div className="business-summary-card">
          <div className="summary-icon summary-icon-green">
            <span className="summary-check">✓</span>
          </div>
          <div>
            <p>Active</p>
            <h3>{statistics.active}</h3>
          </div>
        </div>

        <div className="business-summary-card">
          <div className="summary-icon summary-icon-purple">
            <Icon name="qr" size={19} />
          </div>
          <div>
            <p>Active QR Codes</p>
            <h3>{statistics.qrGenerated}</h3>
          </div>
        </div>

        <div className="business-summary-card">
          <div className="summary-icon summary-icon-orange">
            <Icon name="review" size={19} />
          </div>
          <div>
            <p>Reviews Generated</p>
            <h3>{statistics.reviewsGenerated}</h3>
          </div>
        </div>
        </div>

        <div className="businesses-header-actions">
          <button
            className="secondary-action-button"
            onClick={handleRefresh}
            title="Refresh businesses"
            type="button"
          >
            <Icon name="refresh" size={17} />
            <span>Refresh</span>
          </button>

          <button
            className="primary-action-button"
            onClick={() => onNavigate("create-business")}
            type="button"
          >
            <Icon name="plus" size={17} strokeWidth={2} />
            <span>Generate QR</span>
          </button>
        </div>
      </section>

      {/* FILTER BAR */}

      <section className="business-toolbar">
        <div className="business-search">
          <Icon name="search" size={17} />

          <input
            type="text"
            placeholder="Search businesses by name, ID or category..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {search && (
            <button
              className="search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              type="button"
            >
              ×
            </button>
          )}
        </div>

        <div className="business-filters">
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </section>

      {/* BUSINESS TABLE */}

      <section className="business-table-card">
        <div className="business-table-header">
          <div>
            <h2>All Businesses</h2>
            <p>
              {filteredBusinesses.length}{" "}
              {filteredBusinesses.length === 1 ? "business" : "businesses"}{" "}
              found
            </p>
          </div>
        </div>

        <div className="business-table-wrapper">
          <table className="business-table">
            <thead>
              <tr>
                <th>BUSINESS</th>
                <th>CATEGORY</th>
                <th>QUESTIONS</th>
                <th>QR STATUS</th>
                <th>STATUS</th>
                <th>CREATED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredBusinesses.map((business) => (
                <tr key={business.id} className={business.status === "Active" ? "business-row-active" : "business-row-inactive"}>
                  <td>
                    <div className="business-name-cell">
                      <div className="business-avatar">
                        {business.name?.charAt(0)?.toUpperCase() || "B"}
                      </div>

                      <div>
                        <strong>{business.name}</strong>
                        <span>{business.id}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="category-badge">
                      {business.category || "—"}
                    </span>
                  </td>

                  <td>
                    <div className="questions-count">
                      <strong>{getQuestionCount(business)}/6</strong>
                      <span>selected</span>
                    </div>
                  </td>

                  <td>
                    {business.qrStatus === "Generated" ? (
                      <button
                        type="button"
                        className="business-view-qr-button"
                        onClick={() => handleViewQR(business)}
                        title={`View QR code for ${business.name}`}
                      >
                        <Icon name="qr" size={14} />
                        View QR Code
                      </button>
                    ) : (
                      <span className="qr-status qr-pending">
                        <span />
                        {business.qrStatus || "Pending"}
                      </span>
                    )}
                  </td>

                  <td>
                    <StatusBadge status={business.status || "Active"} />
                  </td>

                  <td>
                    <span className="created-date">
                      {formatDate(business.createdAt)}
                    </span>
                  </td>

                  <td>
                    <div className="business-actions">
                      <button
                        type="button"
                        className="table-action view-action"
                        title="View business"
                        aria-label={`View ${business.name}`}
                        onClick={() => handleView(business)}
                      >
                        <Icon name="eye" size={16} />
                      </button>

                      <button
                        type="button"
                        className="table-action edit-action"
                        title="Edit business"
                        aria-label={`Edit ${business.name}`}
                        onClick={() => handleEdit(business)}
                      >
                        <Icon name="edit" size={16} />
                      </button>

                      <button
                        type="button"
                        className="table-action delete-action"
                        title="Delete business"
                        aria-label={`Delete ${business.name}`}
                        disabled={deletingId === business.id}
                        onClick={() => handleDelete(business)}
                      >
                        {deletingId === business.id ? (
                          <span className="mini-spinner" />
                        ) : (
                          <Icon name="trash" size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* EMPTY STATE */}

          {filteredBusinesses.length === 0 && (
            <div className="business-empty-state">
              <div className="empty-icon">
                <Icon name="business" size={25} />
              </div>

              <h3>
                {hasFilters ? "No businesses found" : "No businesses yet"}
              </h3>

              <p>
                {hasFilters
                  ? "Try changing your search or filters."
                  : "Create your first business to generate a review QR code."}
              </p>

              {hasFilters ? (
                <button
                  className="empty-clear-button"
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("All");
                    setStatusFilter("All");
                  }}
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  className="empty-create-button"
                  type="button"
                  onClick={() => onNavigate("create-business")}
                >
                  <Icon name="plus" size={16} />
                  Generate QR
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* VIEW / EDIT MODAL */}

      {selectedBusiness && (
        <div
          className="business-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="business-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="business-modal-title"
          >
            <div className="business-modal-header">
              <div>
                <span className="business-modal-eyebrow">
                  BUSINESS MANAGEMENT
                </span>
                <h2 id="business-modal-title">
                  {modalMode === "edit"
                    ? "Edit Business"
                    : modalMode === "qr"
                      ? "View QR Code"
                      : "Business Details"}
                </h2>
                <p>{selectedBusiness.id}</p>
              </div>

              <button
                type="button"
                className="business-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {modalError && (
              <div className="business-modal-error">{modalError}</div>
            )}

            {modalLoading ? (
              <div className="business-modal-loading">
                <div className="loading-spinner" />
                <p>Loading business details...</p>
              </div>
            ) : modalMode === "qr" ? (
              <div className="business-modal-body business-qr-modal-body">
                <div className="business-qr-modal-heading">
                  <span>REVIEW QR CODE</span>
                  <h3>{selectedBusiness.name}</h3>
                  <p>{selectedBusiness.id}</p>
                </div>

                {selectedBusiness.qrStatus === "Generated" ? (
                  <>
                    <div className="business-detail-qr-preview business-qr-large-preview">
                      <QRCodeSVG
                        id={`business-qr-${selectedBusiness.id}`}
                        value={getBusinessReviewUrl(selectedBusiness)}
                        size={240}
                        bgColor="#ffffff"
                        fgColor="#17233e"
                        level="H"
                        includeMargin
                      />
                    </div>

                    <div className="business-qr-url-section">
                      <label htmlFor="business-review-url">Review URL</label>
                      <div className="business-qr-url-row">
                        <input
                          id="business-review-url"
                          type="text"
                          value={getBusinessReviewUrl(selectedBusiness)}
                          readOnly
                          onFocus={(event) => event.target.select()}
                        />
                        <button
                          type="button"
                          onClick={() => copyBusinessReviewUrl(selectedBusiness)}
                          title="Copy review URL"
                          aria-label="Copy review URL"
                        >
                          <Icon name="copy" size={16} />
                          Copy
                        </button>
                      </div>
                      <p>Scan this QR code or open the URL to access the business review page.</p>
                    </div>

                    <div className="business-detail-qr-actions">
                      <button
                        type="button"
                        onClick={() => downloadBusinessQR(selectedBusiness)}
                      >
                        <Icon name="download" size={15} />
                        Download QR
                      </button>
                      <button
                        type="button"
                        onClick={() => printBusinessQR(selectedBusiness)}
                      >
                        <Icon name="printer" size={15} />
                        Print QR
                      </button>
                    </div>
                  </>
                ) : (
                  <p>The QR code has not been generated yet.</p>
                )}

                <div className="business-modal-footer">
                  <button
                    type="button"
                    className="business-modal-secondary"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="business-modal-primary"
                    onClick={() => setModalMode("view")}
                  >
                    <Icon name="eye" size={15} />
                    Business Details
                  </button>
                </div>
              </div>
            ) : modalMode === "view" ? (
              <div className="business-modal-body">
                <div className="business-detail-grid">
                  {[
                    ["Business Name", selectedBusiness.name],
                    ["Category", selectedBusiness.category],
                    ["Phone Number", selectedBusiness.phone],
                    ["Address", selectedBusiness.address],
                    ["Google Review URL", selectedBusiness.googleReviewUrl],
                    ["Status", selectedBusiness.status],
                    ["QR Status", selectedBusiness.qrStatus],
                    ["Created", formatDate(selectedBusiness.createdAt)],
                  ].map(([label, value]) => (
                    <div className="business-detail-item" key={label}>
                      <span>{label}</span>
                      {label === "Google Review URL" && value ? (
                        <a
                          href={value}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {value}
                        </a>
                      ) : (
                        <strong>{value || "—"}</strong>
                      )}
                    </div>
                  ))}
                </div>

                <div className="business-detail-questions">
                  <h3>Selected Questions</h3>

                  {Array.isArray(selectedBusiness.selectedQuestions) &&
                  selectedBusiness.selectedQuestions.length > 0 ? (
                    <ol>
                      {selectedBusiness.selectedQuestions.map(
                        (question, index) => {
                          const questionText =
                            typeof question === "string"
                              ? question
                              : question?.question ||
                                question?.text ||
                                question?.label ||
                                JSON.stringify(question);

                          return (
                            <li key={`${index}-${questionText}`}>
                              {questionText}
                            </li>
                          );
                        }
                      )}
                    </ol>
                  ) : (
                    <p>No selected questions available.</p>
                  )}
                </div>

                <div className="business-modal-footer">
                  <button
                    type="button"
                    className="business-modal-secondary"
                    onClick={closeModal}
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    className="business-modal-primary"
                    onClick={switchToEdit}
                  >
                    <Icon name="edit" size={15} />
                    Edit Business
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave}>
                <div className="business-modal-body">
                  <div className="business-edit-grid">
                    <label>
                      Business Name *
                      <input
                        name="name"
                        value={editForm.name || ""}
                        onChange={handleEditChange}
                        required
                      />
                    </label>

                    <label>
                      Category *
                      <input
                        name="category"
                        value={editForm.category || ""}
                        onChange={handleEditChange}
                        required
                      />
                    </label>

                    <label>
                      Phone Number *
                      <input
                        name="phone"
                        type="tel"
                        value={editForm.phone || ""}
                        onChange={handleEditChange}
                        required
                      />
                    </label>

                    <label>
                      Status
                      <select
                        name="status"
                        value={editForm.status || "Active"}
                        onChange={handleEditChange}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </label>

                    <label className="business-edit-full">
                      Business Address *
                      <textarea
                        name="address"
                        rows="3"
                        value={editForm.address || ""}
                        onChange={handleEditChange}
                        required
                      />
                    </label>

                    <label className="business-edit-full">
                      Google Review URL *
                      <input
                        name="googleReviewUrl"
                        type="url"
                        value={editForm.googleReviewUrl || ""}
                        onChange={handleEditChange}
                        required
                      />
                    </label>
                  </div>

                  <p className="business-edit-note">
                    Existing selected questions and QR configuration will be
                    preserved.
                  </p>

                  <div className="business-modal-footer">
                    <button
                      type="button"
                      className="business-modal-secondary"
                      onClick={() => {
                        setModalError("");
                        setModalMode("view");
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="business-modal-primary"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Businesses;