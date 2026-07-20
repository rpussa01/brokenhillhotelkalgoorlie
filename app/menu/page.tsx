import Link from "next/link";

import SiteHeader from "@/components/SiteHeader";
import { getPublicMenu } from "@/lib/db";

export const dynamic = "force-dynamic";

function money(priceCents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(priceCents / 100);
}

export default async function MenuPage() {
  const { settings, categories, items } = await getPublicMenu();

  const activeCategories = [...categories]
    .filter((category) => category.active !== false)
    .sort(
      (a, b) =>
        (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
        a.name.localeCompare(b.name),
    );

  const activeItems = [...items]
    .filter((item) => item.available !== false)
    .sort(
      (a, b) =>
        (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
        a.name.localeCompare(b.name),
    );

  const menuSections = activeCategories
    .map((category) => ({
      category,
      items: activeItems.filter(
        (item) => item.categoryId === category.id,
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      <SiteHeader />

      <main className="venue-menu-page">
        <section className="venue-menu-hero">
          <div className="venue-menu-hero-inner">
            <div>
              <span className="venue-menu-kicker">
                BROKEN HILL HOTEL
              </span>

              <h1>Dine-in menu</h1>

              <p>
                Proper pub food, generous portions and
                familiar favourites made for locals,
                travellers and good nights out.
              </p>
            </div>

            <div className="venue-menu-hero-actions">
              <Link className="button dark" href="/order">
                Order takeaway
              </Link>

              <a
                className="button dark-outline"
                href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
              >
                Call the hotel
              </a>
            </div>
          </div>
        </section>

        <nav
          className="venue-menu-category-nav"
          aria-label="Menu categories"
        >
          <div className="venue-menu-category-nav-inner">
            {menuSections.map(({ category }) => (
              <a
                key={category.id}
                href={`#category-${category.id}`}
              >
                {category.name}
              </a>
            ))}
          </div>
        </nav>

        <section className="venue-menu-content">
          {menuSections.map(({ category, items: categoryItems }) => (
            <section
              className="venue-menu-section"
              id={`category-${category.id}`}
              key={category.id}
            >
              <div className="venue-menu-section-heading">
                <span>THE BROKIE MENU</span>
                <h2>{category.name}</h2>
              </div>

              <div className="venue-menu-grid">
                {categoryItems.map((item) => (
                  <article
                    className={`venue-menu-card ${
                      item.available ? "is-sold-out" : ""
                    }`}
                    key={item.id}
                  >
                    {item.imageUrl ? (
                      <div
                        className="venue-menu-card-image"
                        style={{
                          backgroundImage: `url("${item.imageUrl}")`,
                        }}
                      >
                        {!item.available && (
                          <span className="venue-menu-sold-out-badge">
                            Sold out
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="venue-menu-card-image venue-menu-card-placeholder">
                        <span>BH</span>

                        {item.available  && (
                          <span className="venue-menu-sold-out-badge">
                            Sold out
                          </span>
                        )}
                      </div>
                    )}

                    <div className="venue-menu-card-body">
                      <div className="venue-menu-card-title-row">
                        <h3>{item.name}</h3>
                        <strong>{money(item.priceCents)}</strong>
                      </div>

                      {item.description && (
                        <p>{item.description}</p>
                      )}

                      {Array.isArray(item.dietary) &&
                        item.dietary.length > 0 && (
                          <div className="venue-menu-tags">
                            {item.dietary.map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                        )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>

        <section className="venue-menu-cta">
          <div>
            <span>TAKE THE BROKIE HOME</span>
            <h2>Ready to order?</h2>
            <p>
              Place a pickup order directly through the
              website and collect it from the hotel.
            </p>
          </div>

          <Link className="button light" href="/order">
            Order takeaway
          </Link>
        </section>

        <footer className="venue-menu-footer">
          <div>
            <strong>{settings.venueName}</strong>
            <span>{settings.address}</span>
          </div>

          <a
            href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
          >
            {settings.phone}
          </a>
        </footer>
      </main>
    </>
  );
}