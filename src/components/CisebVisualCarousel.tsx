import React, { useEffect, useState } from "react";
import "./CisebVisualCarousel.css";

type Slide = {
  title: string;
  description: string;
};

const slides: Slide[] = [
  {
    title: "Fotografia e Visão Computacional",
    description:
      "Soluções que capturam, analisam e transformam imagens em dados.",
  },
  {
    title: "Computação e Desenvolvimento",
    description:
      "Sistemas inteligentes para um mundo mais conectado.",
  },
  {
    title: "Impressão 3D e Prototipagem",
    description:
      "Ideias reais, do digital ao seu protótipo.",
  },
  {
    title: "Robótica",
    description:
      "Automação e soluções inteligentes para o seu negócio.",
  },
  {
    title: "Inteligência Artificial",
    description:
      "Mais tecnologia, mais eficiência, mais resultados.",
  },
  {
    title: "Prototipagem e Fabricação",
    description:
      "Do conceito ao produto, com agilidade e precisão.",
  },
];

export default function CisebVisualCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsChanging(true);

      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setIsChanging(false);
      }, 450);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const current = slides[currentSlide];

  return (
    <section className="ciseb-carousel">
      <div className="ciseb-carousel-background" />

      <div className="ciseb-carousel-content">
        {/* TEXTO DINÂMICO */}
        <div className={`ciseb-carousel-copy ${isChanging ? "is-changing" : ""}`}>
          <span className="ciseb-eyebrow">TECNOLOGIA E INOVAÇÃO</span>

          <h1>{current.title}</h1>

          <p>{current.description}</p>

          {/* INDICADORES */}
          <div className="ciseb-dots">
            {slides.map((_, index) => (
              <span
                key={index}
                className={`ciseb-dot ${
                  index === currentSlide ? "active" : ""
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CARDS INFERIORES */}
      <div className="ciseb-cards">
        {slides.slice(0, 3).map((slide) => (
          <article className="ciseb-card text-only-card" key={slide.title}>
            <div className="ciseb-card-content">
              <h3>{slide.title}</h3>
              <p>{slide.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
