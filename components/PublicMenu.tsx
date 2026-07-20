"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type {
  Category,
  MenuItem,
} from "@/lib/types";

type PublicMenuProps = {
  categories: Category[];
  items: MenuItem[];
};

const MENU_FALLBACK_IMAGE =
  "/images/menu-placeholder.jpg";

function money(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export default function PublicMenu({
  categories,
  items,
}: PublicMenuProps) {
  const [activeCategoryId, setActiveCategoryId] =
    useState("");

  const [mobileNavOpen, setMobileNavOpen] =
    useState(false);

  const activeCategories = useMemo(() => {
    return [...categories]
      .filter(
        (category) =>
          category.active !== false,
      )
      .sort(
        (first, second) =>
          (first.displayOrder ?? 0) -
            (second.displayOrder ?? 0) ||
          first.name.localeCompare(
            second.name,
          ),
      );
  }, [categories]);

  const publicItems = useMemo(() => {
    return [...items]
      .filter(
        (item) =>
          item.available !== false,
      )
      .sort(
        (first, second) =>
          (first.displayOrder ?? 0) -
            (second.displayOrder ?? 0) ||
          first.name.localeCompare(
            second.name,
          ),
      );
  }, [items]);

  const visibleCategories = useMemo(() => {
    return activeCategories.filter(
      (category) =>
        publicItems.some(
          (item) =>
            item.categoryId ===
            category.id,
        ),
    );
  }, [
    activeCategories,
    publicItems,
  ]);

  const totalItems = publicItems.length;

  useEffect(() => {
    if (
      !activeCategoryId &&
      visibleCategories.length > 0
    ) {
      setActiveCategoryId(
        visibleCategories[0].id,
      );
    }
  }, [
    activeCategoryId,
    visibleCategories,
  ]);

  useEffect(() => {
    const sections =
      visibleCategories
        .map((category) =>
          document.getElementById(
            `menu-category-${category.id}`,
          ),
        )
        .filter(
          (
            section,
          ): section is HTMLElement =>
            section !== null,
        );

    if (!sections.length) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const visibleEntry = entries
            .filter(
              (entry) =>
                entry.isIntersecting,
            )
            .sort(
              (first, second) =>
                second.intersectionRatio -
                first.intersectionRatio,
            )[0];

          if (!visibleEntry) {
            return;
          }

          const categoryId =
            visibleEntry.target.getAttribute(
              "data-category-id",
            );

          if (categoryId) {
            setActiveCategoryId(
              categoryId,
            );
          }
        },
        {
          rootMargin:
            "-20% 0px -65% 0px",
          threshold: [
            0.05,
            0.15,
            0.3,
            0.5,
          ],
        },
      );

    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, [visibleCategories]);

  function scrollToCategory(
    categoryId: string,
  ) {
    const section =
      document.getElementById(
        `menu-category-${categoryId}`,
      );

    if (!section) {
      return;
    }

    setActiveCategoryId(categoryId);
    setMobileNavOpen(false);

    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <>
      <header className="topbar">
        <Link
          className="brand"
          href="/"
        >
          <span className="mark">
            BH
          </span>

          <span>
            BROKEN HILL
            <small>
              HOTEL • EST. 1899
            </small>
          </span>
        </Link>

        <nav
          className={`nav ${
            mobileNavOpen
              ? "nav-open"
              : ""
          }`}
        >
          <Link
            href="/"
            onClick={() =>
              setMobileNavOpen(false)
            }
          >
            Home
          </Link>

          <Link
            href="/menu"
            className="active"
            onClick={() =>
              setMobileNavOpen(false)
            }
          >
            Menu
          </Link>

          <Link
            href="/order"
            onClick={() =>
              setMobileNavOpen(false)
            }
          >
            Order online
          </Link>

          <a
            href="tel:+61890930306"
            className="button"
            onClick={() =>
              setMobileNavOpen(false)
            }
          >
            Call hotel
          </a>
        </nav>

        <button
          type="button"
          className="mobile-nav-toggle"
          aria-label={
            mobileNavOpen
              ? "Close navigation"
              : "Open navigation"
          }
          aria-expanded={
            mobileNavOpen
          }
          onClick={() =>
            setMobileNavOpen(
              (current) => !current,
            )
          }
        >
          {mobileNavOpen ? (
            <CloseIcon />
          ) : (
            <MenuIcon />
          )}
        </button>
      </header>

      <section className="hero menu-hero">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">
              DINE IN • SOUTH BOULDER
            </div>

            <h1>
              Pub favourites,
              made properly.
            </h1>

            <p>
              Explore the full Broken Hill
              Hotel menu, including steaks,
              burgers, pizzas, pub classics
              and seasonal kitchen
              favourites.
            </p>

            <div className="menu-hero-actions">
              <a
                className="button"
                href="#public-menu"
              >
                View menu
              </a>

              <Link
                className="button secondary"
                href="/order"
              >
                Order takeaway
              </Link>
            </div>
          </div>

          <div className="open-card">
            <span className="dot" />

            <div>
              <strong>
                Full dine-in menu
              </strong>

              <p>
                {visibleCategories.length}{" "}
                {visibleCategories.length ===
                1
                  ? "category"
                  : "categories"}{" "}
                • {totalItems}{" "}
                {totalItems === 1
                  ? "dish"
                  : "dishes"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div
        className="category-tabs"
        id="public-menu"
      >
        {visibleCategories.map(
          (category) => (
            <button
              type="button"
              key={category.id}
              className={
                activeCategoryId ===
                category.id
                  ? "active"
                  : ""
              }
              onClick={() =>
                scrollToCategory(
                  category.id,
                )
              }
            >
              {category.name}
            </button>
          ),
        )}
      </div>

      <main className="public-menu-page">
        {!visibleCategories.length ? (
          <section className="public-menu-empty">
            <div>
              <span>BH</span>
              <h2>
                Menu coming soon
              </h2>

              <p>
                Our current menu is being
                updated. Please call the
                hotel for today&apos;s
                available dishes.
              </p>

              <a
                className="button"
                href="tel:+61890930306"
              >
                Call hotel
              </a>
            </div>
          </section>
        ) : (
          visibleCategories.map(
            (category) => {
              const categoryItems =
                publicItems.filter(
                  (item) =>
                    item.categoryId ===
                    category.id,
                );

              return (
                <section
                  className="category-section public-menu-section"
                  id={`menu-category-${category.id}`}
                  data-category-id={
                    category.id
                  }
                  key={category.id}
                >
                  <div className="menu-category-heading">
                    <div>
                      <div className="eyebrow">
                        BROKEN HILL HOTEL
                      </div>

                      <h2>
                        {category.name}
                      </h2>
                    </div>

                    <span>
                      {
                        categoryItems.length
                      }{" "}
                      {categoryItems.length ===
                      1
                        ? "item"
                        : "items"}
                    </span>
                  </div>

                  <div className="menu-grid menu-grid-visual public-menu-grid">
                    {categoryItems.map(
                      (item) => {
                        const dietary =
                          Array.isArray(
                            item.dietary,
                          )
                            ? item.dietary
                            : [];

                        const soldOut =
                          item.soldOut ===
                          true;

                        const serviceLabel =
                          item.dineInOnly
                            ? "Dine in only"
                            : item.takeaway
                              ? "Dine in or takeaway"
                              : "Dine in";

                        return (
                          <article
                            className={`menu-card menu-card-visual public-menu-card ${
                              soldOut
                                ? "sold"
                                : ""
                            }`}
                            key={item.id}
                          >
                            <div
                              className="menu-card-image"
                              style={{
                                backgroundImage: `url("${
                                  item.imageUrl ||
                                  MENU_FALLBACK_IMAGE
                                }")`,
                              }}
                            >
                              <div className="menu-card-image-shade" />

                              {soldOut && (
                                <span className="menu-sold-badge">
                                  SOLD OUT
                                </span>
                              )}

                              {item.dineInOnly &&
                                !soldOut && (
                                  <span className="dine-in-only-badge">
                                    DINE IN ONLY
                                  </span>
                                )}

                              {dietary.length >
                                0 && (
                                <div className="menu-card-image-tags">
                                  {dietary.map(
                                    (tag) => (
                                      <span
                                        key={
                                          tag
                                        }
                                      >
                                        {
                                          tag
                                        }
                                      </span>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="menu-card-body">
                              <div>
                                <h3>
                                  {
                                    item.name
                                  }
                                </h3>

                                <p>
                                  {item.description ||
                                    "A favourite from the Broken Hill Hotel kitchen."}
                                </p>
                              </div>

                              <div className="menu-bottom public-menu-card-bottom">
                                <strong>
                                  {money(
                                    item.priceCents,
                                  )}
                                </strong>

                                <span
                                  className={`menu-service-label ${
                                    soldOut
                                      ? "unavailable"
                                      : ""
                                  }`}
                                >
                                  {soldOut
                                    ? "Unavailable"
                                    : serviceLabel}
                                </span>
                              </div>
                            </div>
                          </article>
                        );
                      },
                    )}
                  </div>
                </section>
              );
            },
          )
        )}
      </main>

      <section className="public-menu-order-cta">
        <div>
          <div className="eyebrow">
            PICKUP AVAILABLE
          </div>

          <h2>
            Prefer takeaway?
          </h2>

          <p>
            Browse the online menu and place
            your pickup order directly
            through the website.
          </p>
        </div>

        <Link
          className="button"
          href="/order"
        >
          Order online
        </Link>
      </section>

      <footer className="site-footer">
        <div>
          <Link
            className="brand"
            href="/"
          >
            <span className="mark">
              BH
            </span>

            <span>
              BROKEN HILL
              <small>
                HOTEL • EST. 1899
              </small>
            </span>
          </Link>

          <p>
            Classic hospitality in South
            Boulder.
          </p>
        </div>

        <div>
          <strong>Visit</strong>
          <p>
            Broken Hill Hotel
            <br />
            South Boulder, WA
          </p>
        </div>

        <div>
          <strong>Contact</strong>

          <a href="tel:+61890930306">
            (08) 9093 0306
          </a>
        </div>

        <div>
          <strong>Explore</strong>

          <Link href="/menu">
            Dine-in menu
          </Link>

          <Link href="/order">
            Order online
          </Link>
        </div>
      </footer>
    </>
  );
}