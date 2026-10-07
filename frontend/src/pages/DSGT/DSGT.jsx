import React from "react";
import "./DSGT.css";

import slide1ThankYou from "./assets/slide1_thank_you.png";
import slide2Conclusion from "./assets/slide2_conclusion.png";
import slide3FourClassifications from "./assets/slide3_four_classifications.png";
import slide4EulerianVsHamiltonian from "./assets/slide4_eulerian_vs_hamiltonian.png";

const speakerDivision = [
  {
    role: "1st person — Slides 1–4",
    text: "Introduction and graph basics: vertices, edges, adjacency, degree, connected/simple graphs, walk, trail, path, circuit and cycle. Explain the differences using the diagrams.",
  },
  {
    role: "2nd person — Slides 5–7",
    text: "Introduce Eulerian graphs, explain Euler paths with the example, and cover the odd-degree test for whether an Euler path exists.",
  },
  {
    role: "3rd person — Slides 8–10",
    text: "Explain Euler circuits and their conditions, then introduce Hamiltonian graphs and the idea of visiting every vertex once.",
  },
  {
    role: "4th person — Slides 11–13",
    text: "Explain Hamiltonian paths and circuits with examples. Cover the necessary conditions and Dirac’s and Ore’s sufficient conditions.",
  },
  {
    role: "5th person — Slides 14–17",
    text: "Compare Eulerian and Hamiltonian traversal, explain the four possible graph classifications, conclude and present the Thank You slide.",
  },
];

const prepInstructions = [
  "The number at the bottom of each slide shows who will speak.",
  "Check the Notes section in PowerPoint for explanations and handoffs.",
  "Understand your diagrams and trace the example routes while explaining. Don’t just read the slide.",
  "Aim for roughly 2–3 minutes each.",
  "Everyone should remember the main difference: Eulerian covers every edge once; Hamiltonian visits every vertex once.",
  "Remember that failing Dirac’s or Ore’s test does not prove that a Hamiltonian circuit is impossible.",
  "Learn the basic comparison too, so everyone can answer questions.",
];

const slideItems = [
  {
    id: "image-1",
    label: "IMAGE 1 → Thank You / Questions",
    src: slide1ThankYou,
    alt: "Thank You / Questions slide",
  },
  {
    id: "image-2",
    label: "IMAGE 2 → Conclusion",
    src: slide2Conclusion,
    alt: "Conclusion slide",
  },
  {
    id: "image-3",
    label: "IMAGE 3 → Four possible graph classifications",
    src: slide3FourClassifications,
    alt: "Four possible graph classifications slide",
  },
  {
    id: "image-4",
    label: "IMAGE 4 → Eulerian vs Hamiltonian comparison",
    src: slide4EulerianVsHamiltonian,
    alt: "Eulerian vs Hamiltonian comparison table slide",
  },
];

export default function DSGT() {
  return (
    <div className="dsgt-page">
      <div className="dsgt-container">
        {/* Header Section */}
        <header className="dsgt-header">
          <span className="dsgt-badge">DSGT</span>
          <h1 className="dsgt-trisha-title">Trisha's Part</h1>
          <p className="dsgt-subtitle">DSGT Presentation</p>
          <h2 className="dsgt-title">Eulerian vs Hamiltonian Graphs</h2>
        </header>

        {/* Presentation Message Card */}
        <section className="dsgt-message-card">
          <p className="dsgt-message-intro">
            Guys, our presentation topic is Eulerian vs Hamiltonian Graphs. The final PPT has 17 slides, and this is our division:
          </p>

          <div className="dsgt-division-grid">
            {speakerDivision.map((item, idx) => (
              <div key={idx} className="dsgt-division-item">
                <h3 className="dsgt-speaker-title">{item.role}</h3>
                <p className="dsgt-speaker-desc">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="dsgt-prep-block">
            <h2 className="dsgt-prep-heading">Preparation instructions:</h2>
            <ul className="dsgt-prep-list">
              {prepInstructions.map((instruction, idx) => (
                <li key={idx} className="dsgt-prep-item">
                  {instruction}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Slides Gallery - Stacked One Below Another */}
        <section className="dsgt-slides-section">
          {slideItems.map((slide) => (
            <article key={slide.id} className="dsgt-slide-card">
              <div className="dsgt-slide-card-header">
                <span className="dsgt-slide-label">{slide.label}</span>
              </div>
              <div className="dsgt-slide-img-wrapper">
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="dsgt-slide-image"
                  loading="lazy"
                />
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
