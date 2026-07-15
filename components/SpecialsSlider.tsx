"use client";

import { useRef, useState } from "react";

type Special = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  day: string | null;
  badge: string | null;
  imageUrl: string | null;
};

type SpecialsSliderProps = {
  specials: Special[];
};

const money = (price: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);

export default function SpecialsSlider({
  specials,
}: SpecialsSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function goTo(index: number) {
    if (!specials.length) return;

    const safeIndex =
      (index + specials.length) % specials.length;

    const track = trackRef.current;
    const slide = track?.children[safeIndex] as HTMLElement | undefined;

    slide?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });

    setActiveIndex(safeIndex);
  }

  function updateActiveSlide() {
    const track = trackRef.current;
    if (!track) return;

    const slides = Array.from(track.children) as HTMLElement[];
    const trackLeft = track.getBoundingClientRect().left;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const distance = Math.abs(
        slide.getBoundingClientRect().left - trackLeft,
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveIndex(nearestIndex);
  }

  if (!specials.length) return null;

  return (
    <section
      className="home-section specials-slider-section"
      id="specials"
    >
      <div className="specials-slider-heading">
        <div>
          <div className="section-kicker">CHEF&apos;S SPECIALS</div>
          <h2>
            Something good
            <br />
            is always on.
          </h2>
        </div>

        <div className="specials-slider-controls">
          <button
            type="button"
            className="special-slider-arrow"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Previous special"
          >
            ←
          </button>

          <button
            type="button"
            className="special-slider-arrow"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Next special"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="specials-slider-track"
        onScroll={updateActiveSlide}
      >
        {specials.map((special, index) => (
          <article
            className="special-slide"
            key={special.id}
            style={{
              backgroundImage: special.imageUrl
                ? `url("${special.imageUrl}")`
                : "url('/images/special-placeholder.jpg')",
            }}
          >
            <div className="special-slide-overlay" />

            <div className="special-slide-content">
              <div className="special-slide-topline">
                <div className="special-slide-labels">
                  {special.badge && (
                    <span className="special-slide-badge">
                      {special.badge}
                    </span>
                  )}

                  {special.day && (
                    <span className="special-slide-day">
                      {special.day}
                    </span>
                  )}
                </div>

                <span className="special-slide-count">
                  {String(index + 1).padStart(2, "0")} /{" "}
                  {String(specials.length).padStart(2, "0")}
                </span>
              </div>

              <div className="special-slide-copy">
                <h3>{special.title}</h3>

                {special.description && (
                  <p>{special.description}</p>
                )}
              </div>

              <div className="special-slide-bottom">
                {special.price !== null && (
                  <strong>{money(special.price)}</strong>
                )}

                <a className="button light" href="/order">
                  Order this special
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      {specials.length > 1 && (
        <div className="special-slider-dots">
          {specials.map((special, index) => (
            <button
              type="button"
              key={special.id}
              className={index === activeIndex ? "active" : ""}
              onClick={() => goTo(index)}
              aria-label={`View special ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
