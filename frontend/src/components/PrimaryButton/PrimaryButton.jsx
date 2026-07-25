import "./PrimaryButton.css";
import { Link } from "react-router-dom";

const PrimaryButton = ({
  text,
  to = "/",
  onClick,
  variant = "outline",
}) => {
  if (to) {
    return (
      <Link
        to={to}
        className={`primary-btn ${variant}`}
      >
        {text}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`primary-btn ${variant}`}
    >
      {text}
    </button>
  );
};

export default PrimaryButton;