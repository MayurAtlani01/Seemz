import "./FeaturedGrid.css";
import { Link } from "react-router-dom";

const FeaturedGrid = ({ items = [] }) => {
  return (
    <div className="featured-grid">

      {items.map((item) => (
        <Link
          to={item.link}
          className="featured-card"
          key={item.id}
        >
          <img
            src={item.image}
            alt={item.title}
          />

          <div className="featured-overlay">

            <h3>{item.title}</h3>

            <span>
              Explore Collection →
            </span>

          </div>

        </Link>
      ))}

    </div>
  );
};

export default FeaturedGrid;