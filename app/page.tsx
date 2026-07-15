import SiteHeader from "@/components/SiteHeader";
import SpecialsSlider from "@/components/SpecialsSlider";
import { getPublicMenu, getSpecials } from "@/lib/db";

export const dynamic = "force-dynamic";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=2200&q=88";

const BAR_IMAGE =
  "https://www.beerdrawingservices.com.au/wp-content/uploads/2020/08/16-min-719x1024.jpg";

function money(priceCents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}

export default async function Home() {
  const [{ settings, categories, items }, specials] = await Promise.all([
    getPublicMenu(),
    getSpecials(),
  ]);

  const activeCategories = categories
    .filter((category) => category.active)
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.name.localeCompare(b.name),
    );

  const activeItems = items
    .filter((item) => item.active)
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.name.localeCompare(b.name),
    );

  const categoryNameById = new Map(
    activeCategories.map((category) => [
      category.id,
      category.name.toLowerCase(),
    ]),
  );

  const drinkKeywords = [
    "drink",
    "drinks",
    "beverage",
    "beverages",
    "beer",
    "wine",
    "spirits",
    "bar",
  ];

  const drinkItems = activeItems.filter((item) => {
    const categoryName = categoryNameById.get(item.categoryId) ?? "";
    return drinkKeywords.some((keyword) =>
      categoryName.includes(keyword),
    );
  });

  const foodItems = activeItems.filter((item) => {
    const categoryName = categoryNameById.get(item.categoryId) ?? "";
    return !drinkKeywords.some((keyword) =>
      categoryName.includes(keyword),
    );
  });

  const featuredFood =
    foodItems.find((item) => item.imageUrl && !item.soldOut) ??
    foodItems.find((item) => item.imageUrl) ??
    foodItems[0] ??
    null;

  const featuredDrink =
    drinkItems.find((item) => item.imageUrl && !item.soldOut) ??
    drinkItems.find((item) => item.imageUrl) ??
    drinkItems[0] ??
    null;

  const favouriteItems = foodItems
    .filter((item) => !item.soldOut && item.imageUrl)
    .slice(0, 3);

  const phoneHref = `tel:${settings.phone.replace(/[^+\d]/g, "")}`;

  return (
    <>
      <div className="announcement">
        <span>Open daily • Cold beer • Great food • Local hospitality</span>
        <a href="/order">Order food online →</a>
      </div>

      <SiteHeader />

      <main>
        <section
          className="home-hero"
          style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
        >
          <div className="home-overlay" />

          <div className="home-hero-content">
            <div className="eyebrow">THE LOCAL SINCE 1899</div>

            <h1>
              Good food.
              <br />
              Cold beer.
              <br />
              <em>No fuss.</em>
            </h1>

            <p>
              A true Kalgoorlie-Boulder pub with hearty meals,
              welcoming rooms and the kind of local atmosphere you
              cannot manufacture.
            </p>

            <div className="home-actions">
              <a className="button" href="/order">
                Order food
              </a>

              <a className="button ghost" href="#eat">
                Explore the menu
              </a>
            </div>
          </div>

          <div className="home-meta">
            {settings.address} • {settings.phone}
          </div>
        </section>

        {activeCategories.length > 0 && (
          <section className="home-ticker">
            {activeCategories.map((category, index) => (
              <span className="home-ticker-item" key={category.id}>
                <span>{category.name.toUpperCase()}</span>
                {index < activeCategories.length - 1 && <b>✦</b>}
              </span>
            ))}
          </section>
        )}

        <section className="home-section intro-section">
          <div className="section-kicker">WELCOME TO THE BROKIE</div>

          <div className="intro-grid">
            <h2>
              Built on history.
              <br />
              Made for today.
            </h2>

            <div>
              <p>
                From knock-off drinks to generous pub classics,
                weekend catch-ups and a comfortable place to stay,
                the Broken Hill Hotel is where locals and travellers
                come together.
              </p>

              <a className="text-link" href="#visit">
                Plan your visit ↗
              </a>
            </div>
          </div>
        </section>

        <section className="home-section home-feature-grid" id="eat">
          {featuredFood && (
            <article
              className="home-feature-card"
              style={
                featuredFood.imageUrl
                  ? {
                      backgroundImage: `url("${featuredFood.imageUrl}")`,
                    }
                  : undefined
              }
            >
              <div>
                <div className="eyebrow">EAT</div>

                <h3>{featuredFood.name}</h3>

                {featuredFood.description && (
                  <p>{featuredFood.description}</p>
                )}

                <div className="feature-card-bottom">
                  <strong>{money(featuredFood.priceCents)}</strong>

                  <a className="button light" href="/order">
                    View menu and order
                  </a>
                </div>
              </div>
            </article>
          )}

          <article
            className="home-feature-card bar-card"
            style={{ backgroundImage: `url("${BAR_IMAGE}")` }}
          >
            <div>
              <div className="eyebrow">DRINK</div>

              <h3>
                Your local,
                <br />
                poured right.
              </h3>

              <p>
                Cold taps, classic spirits and easygoing service from
                open until late.
              </p>

              <div className="feature-card-bottom">
                {featuredDrink && (
                  <strong>{money(featuredDrink.priceCents)}</strong>
                )}

                <a className="button light" href="#visit">
                  See venue details
                </a>
              </div>
            </div>
          </article>
        </section>

        {specials.length > 0 && (
          <SpecialsSlider
            specials={specials.map((special) => ({
              id: special.id,
              title: special.title,
              description: special.description,
              price:
                special.price === null
                  ? null
                  : Number(special.price),
              day: special.day,
              badge: special.badge,
              imageUrl: special.imageUrl,
            }))}
          />
        )}

        {favouriteItems.length > 0 && (
          <section className="home-section favourites-section">
            <div className="home-section-head">
              <div>
                <div className="section-kicker">BROKIE FAVOURITES</div>
                <h2>What are you hungry for?</h2>
              </div>

              <a className="button dark" href="/order">
                Full online menu
              </a>
            </div>

            <div className="favourite-grid">
              {favouriteItems.map((item) => (
                <article className="favourite-card" key={item.id}>
                  <div
                    className="favourite-image"
                    style={{
                      backgroundImage: `url("${item.imageUrl}")`,
                    }}
                  />

                  <div className="favourite-info">
                    <div>
                      <h3>{item.name}</h3>

                      {item.description && <p>{item.description}</p>}

                      {Array.isArray(item.dietary) &&
                        item.dietary.length > 0 && (
                          <div className="tags">
                            {item.dietary.map((tag) => (
                              <span className="tag" key={tag}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>

                    <strong>{money(item.priceCents)}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="home-section stay-section" id="stay">
          <div className="stay-photo">
            <span>ROOMS AVAILABLE</span>
          </div>

          <div className="stay-copy">
            <div className="section-kicker">STAY AT THE BROKIE</div>

            <h2>Simple, comfortable, convenient.</h2>

            <p>
              Whether you are in town for work, passing through the
              Goldfields, or staying for the weekend, settle into
              practical accommodation close to everything you need.
            </p>

            <div className="amenity-grid">
              <span>✓ Free Wi-Fi</span>
              <span>✓ On-site bar and dining</span>
              <span>✓ Easy parking</span>
              <span>✓ Central Boulder location</span>
            </div>

            <a className="button" href={phoneHref}>
              Call to book a room
            </a>
          </div>
        </section>

        <section className="home-section whats-on-section" id="whats-on">
          <div className="section-kicker">WHAT&apos;S ON</div>

          <h2>There is always a reason to drop in.</h2>

          <div className="event-list">
            <article>
              <div className="event-date">
                <strong>WED</strong>
                <span>WEEKLY</span>
              </div>

              <div>
                <h3>Midweek Meal Deal</h3>
                <p>
                  A rotating pub favourite at a locals-friendly price.
                </p>
              </div>

              <a href={phoneHref}>Enquire →</a>
            </article>

            <article>
              <div className="event-date">
                <strong>FRI</strong>
                <span>WEEKLY</span>
              </div>

              <div>
                <h3>Friday Knock-Offs</h3>
                <p>
                  Cold drinks, good company and the weekend starts
                  here.
                </p>
              </div>

              <a href="#visit">Get directions →</a>
            </article>

            <article>
              <div className="event-date">
                <strong>LIVE</strong>
                <span>SPORT</span>
              </div>

              <div>
                <h3>Big Games on Screen</h3>
                <p>Catch major fixtures live in the public bar.</p>
              </div>

              <a href={phoneHref}>Check schedule →</a>
            </article>
          </div>
        </section>

        <section className="home-order-banner">
          <div>
            <div className="eyebrow dark-text">SKIP THE QUEUE</div>
            <h2>Dinner sorted in a few taps.</h2>
            <p>
              Browse the menu, choose your pickup time and place your
              order directly with the hotel.
            </p>
          </div>

          <a className="button dark" href="/order">
            Start an order
          </a>
        </section>

        <section className="home-section visit-section" id="visit">
          <div>
            <div className="section-kicker">FIND US</div>

            <h2>
              Better at
              <br />
              the Brokie.
            </h2>

            <div className="visit-grid">
              <div>
                <small>ADDRESS</small>
                <p>{settings.address}</p>
              </div>

              <div>
                <small>PHONE</small>
                <p>
                  <a href={phoneHref}>{settings.phone}</a>
                </p>
              </div>

              <div>
                <small>ORDERING</small>
                <p>
                  {settings.isOrderingOpen
                    ? "Online ordering open"
                    : "Online ordering closed"}
                  <br />
                  Typical pickup {settings.pickupMinutes} minutes
                </p>
              </div>

              <div>
                <small>SOCIAL</small>
                <p>
                  <a
                    href="https://www.instagram.com/thebrokenhillkalgoorlie/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Instagram ↗
                  </a>
                </p>
              </div>
            </div>

            <a
              className="button"
              target="_blank"
              rel="noreferrer"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                settings.address,
              )}`}
            >
              Get directions
            </a>
          </div>

          <div className="map-panel">
            <div className="map-pin">BH</div>

            <div className="map-label">
              <strong>{settings.venueName}</strong>
              <span>{settings.address}</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="brand">
          <span className="mark">BH</span>

          <span>
            {settings.venueName}
            <small>YOUR LOCAL SINCE 1899</small>
          </span>
        </div>

        <div className="footer-links">
          <a href="#eat">Eat</a>
          <a href="#stay">Stay</a>
          <a href="#whats-on">What&apos;s On</a>
          <a href="#visit">Contact</a>
          <a href="/order">Order online</a>
        </div>

        <p>
          © {new Date().getFullYear()} {settings.venueName} • Drink
          responsibly • 18+
        </p>
      </footer>
    </>
  );
}
