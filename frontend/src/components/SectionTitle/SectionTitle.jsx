import "./SectionTitle.css";

const SectionTitle = ({
  subtitle,
  title,
  description,
  align = "center",
}) => {
  return (
    <div className={`section-title ${align}`}>
      {subtitle && (
        <p className="section-subtitle">
          {subtitle}
        </p>
      )}

      <h2 className="section-heading">
        {title}
      </h2>

      {description && (
        <span className="section-description">
          {description}
        </span>
      )}
    </div>
  );
};

export default SectionTitle;