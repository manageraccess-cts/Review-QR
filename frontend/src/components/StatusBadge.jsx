const StatusBadge = ({ status = "Active" }) => {
    const normalizedStatus = status.toLowerCase();
  
    return (
      <span
        className={`status-badge ${
          normalizedStatus === "active"
            ? "status-active"
            : normalizedStatus === "inactive"
            ? "status-inactive"
            : "status-pending"
        }`}
      >
        <span className="status-dot" />
        {status}
      </span>
    );
  };
  
  export default StatusBadge;