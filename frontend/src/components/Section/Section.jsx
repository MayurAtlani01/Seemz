import "./Section.css";
import Container from "../Container/Container";

const Section = ({
  children,
  className = "",
  dark = true,
}) => {
  return (
    <section
      className={`section ${dark ? "dark" : "light"} ${className}`}
    >
      <Container>
        {children}
      </Container>
    </section>
  );
};

export default Section;