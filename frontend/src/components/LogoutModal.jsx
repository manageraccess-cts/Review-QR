
import "./LogoutModal.css";

function LogoutModal({ onCancel, onConfirm }) {
  return (
    <div className="logout-overlay" onClick={onCancel}>
      <div
        className="logout-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="logout-icon">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>

        <h2>Confirm Logout</h2>
        <p>
          Are you sure you want to log out of your account?
        </p>

        <div className="logout-actions">
          <button
            type="button"
            className="logout-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            className="logout-confirm"
            onClick={onConfirm}
          >
            Yes, Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutModal;