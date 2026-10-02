import Icon from "./Icon";

const StatCard = ({
  title,
  value,
  description,
  icon,
  iconClass = "",
}) => {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className={`stat-icon ${iconClass}`}>
          <Icon name={icon} size={21} />
        </div>
      </div>

      <div className="stat-content">
        <p className="stat-title">{title}</p>
        <h3 className="stat-value">{value}</h3>

        {description && (
          <p className="stat-description">{description}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;