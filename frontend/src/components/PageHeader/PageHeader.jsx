import "./PageHeader.css";

const PageHeader = ({
  title,
  subtitle,
}) => {
  return (
    <div className="page-header">

      <p>{subtitle}</p>

      <h1>{title}</h1>

    </div>
  );
};

export default PageHeader;