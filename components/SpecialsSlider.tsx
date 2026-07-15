"use client";

import { useEffect, useRef, useState } from "react";

type Special = {
  id: string;
  title: string;
  description: string | null;
  price: number | string | null;
  day: string | null;
  badge: string | null;
  imageUrl: string | null;
};

type SpecialsSliderProps = {
  specials: Special[];
};

export default function SpecialsSlider({
  specials,
}: SpecialsSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function scrollToIndex(index: number) {
    const track = trackRef.current;

    if (!track || specials.length === 0) {
      return;
    }

    const safeIndex =
      (index + specials.length) % specials.length;

    const slide = track.children[safeIndex] as HTMLElement | undefined;

    slide?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });

    setActiveIndex(safeIndex);
  }

  function goPrevious() {
    scrollToIndex(activeIndex - 1);
  }

  function goNext() {
    scrollToIndex(activeIndex + 1);
  }

  useEffect(() => {
    if (specials.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => {
        const nextIndex =
          (currentIndex + 1) % specials.length;

        const track = trackRef.current;
        const slide = track?.children[nextIndex] as
          | HTMLElement
          | undefined;

        slide?.scrollIntoView({
          behavior: "smooth",
          inline: "start",
          block: "nearest",
        });

        return nextIndex;
      });
    }, 6000);

    return () => window.clearInterval(timer);
  }, [specials.length]);

  if (specials.length === 0) {
  return (
    <section className="home-section specials-slider-section" id="specials">
      <div className="specials-slider-heading">
        <div>
          <div className="section-kicker">CURRENT SPECIALS</div>
          <h2>
            Something good
            <br />
            is always on.
          </h2>
        </div>
      </div>

      <div className="specials-empty">
        <h3>No specials available right now.</h3>
        <p>Check back soon or call the hotel for today&apos;s offers.</p>
        <a className="button light" href="tel:+61890930306">
          Call the hotel
        </a>
      </div>
    </section>
  );
}

  return (
    <section
      className="home-section specials-slider-section"
      id="specials"
    >
      <div className="specials-slider-heading">
        <div>
          <div className="section-kicker">
            CURRENT SPECIALS
          </div>

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
            onClick={goPrevious}
            aria-label="Previous special"
          >
            ←
          </button>

          <button
            type="button"
            className="special-slider-arrow"
            onClick={goNext}
            aria-label="Next special"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="specials-slider-track"
      >
        {specials.map((special, index) => (
          <article
            key={special.id}
            className="special-slide"
            style={{
              backgroundImage: special.imageUrl
                ? `url("${special.imageUrl}")`
                : "url('/images/special-placeholder.jpg')",
            }}
          >
            <div className="special-slide-overlay" />

            <div className="special-slide-content">
              <div className="special-slide-topline">
                <div>
                  {special.day && (
                    <span className="special-slide-day">
                      {special.day.toUpperCase()}
                    </span>
                  )}

                  {special.badge && (
                    <span className="special-slide-badge">
                      {special.badge.toUpperCase()}
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
                  <strong>
                    ${Number(special.price).toFixed(2)}
                  </strong>
                )}

                <a
                  className="button light"
                  href="/order"
                >
                  Order this special
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="special-slider-dots">
        {specials.map((special, index) => (
          <button
            key={special.id}
            type="button"
            className={
              index === activeIndex ? "active" : ""
            }
            aria-label={`View special ${index + 1}`}
            onClick={() => scrollToIndex(index)}
          />
        ))}
      </div>
    </section>
  );
}