import SiteHeader from "@/components/SiteHeader";
import SpecialsSlider from "@/components/SpecialsSlider";
import UpcomingSports from "@/components/UpcomingSports";
import { getPublicMenu, getSpecials } from "@/lib/db";
import { getUpcomingSports } from "@/lib/sports";

export const dynamic = "force-dynamic";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=2200&q=88";

const EAT_CARD_IMAGE =
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=85";

const BAR_CARD_IMAGE =
  "https://www.beerdrawingservices.com.au/wp-content/uploads/2020/08/16-min-719x1024.jpg";

const BOOKING_IMAGE =
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=88";

const GIFT_CARD_URL =
  process.env.NEXT_PUBLIC_GIFT_CARD_URL?.trim() ?? "";

const GIFT_CARDS_AVAILABLE =
  process.env.NEXT_PUBLIC_GIFT_CARDS_ENABLED === "true" &&
  Boolean(GIFT_CARD_URL);

const BOOKING_URL =
  process.env.NEXT_PUBLIC_BOOKING_URL?.trim() ?? "";

const BOOKINGS_AVAILABLE =
  process.env.NEXT_PUBLIC_BOOKINGS_ENABLED === "true" &&
  Boolean(BOOKING_URL);

function money(priceCents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}

export default async function Home() {
  const [
    { settings, categories, items },
    specials,
    upcomingSports,
  ] = await Promise.all([
    getPublicMenu(),
    getSpecials(),
    getUpcomingSports(),
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

  const foodItems = activeItems.filter((item) => {
    const categoryName =
      categoryNameById.get(item.categoryId) ?? "";

    return !drinkKeywords.some((keyword) =>
      categoryName.includes(keyword),
    );
  });

  const favouriteItems = foodItems
    .filter(
      (item) =>
        !item.soldOut &&
        Boolean(item.imageUrl),
    )
    .slice(0, 3);

  const phoneHref = `tel:${settings.phone.replace(
    /[^+\d]/g,
    "",
  )}`;

  const mapsHref =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(settings.address);

  const bookingHref = BOOKINGS_AVAILABLE
    ? BOOKING_URL
    : phoneHref;

  return (
    <>
      <div className="announcement">
        <span>
          Open daily • Cold beer • Great food • Local hospitality
        </span>

        <div className="announcement-actions">
          <a href="#live-sport">
            Live sport
          </a>

          <a href="#book">
            Book a table
          </a>

          <a href="#gift-cards">
            Gift cards
          </a>

          <a href="/order">
            Order food online →
          </a>
        </div>
      </div>

      <SiteHeader />

      <main>
        {/* Hero */}
        <section
          className="home-hero"
          style={{
            backgroundImage: `url("${HERO_IMAGE}")`,
          }}
        >
          <div className="home-overlay" />

          <div className="home-hero-content">
            <div className="eyebrow">
              THE LOCAL SINCE 1899
            </div>

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
              <a
                className="button"
                href="#book"
              >
                Book a table
              </a>

              <a
                className="button ghost"
                href="/order"
              >
                Order food
              </a>

              <a
                className="button ghost"
                href="#live-sport"
              >
                Live sport
              </a>
            </div>
          </div>

          <div className="home-meta">
            {settings.address} • {settings.phone}
          </div>
        </section>

        {/* Category ticker */}
        {activeCategories.length > 0 && (
          <section className="home-ticker">
            {activeCategories.map(
              (category, index) => (
                <span
                  className="home-ticker-item"
                  key={category.id}
                >
                  <span>
                    {category.name.toUpperCase()}
                  </span>

                  {index <
                    activeCategories.length - 1 && (
                    <b>✦</b>
                  )}
                </span>
              ),
            )}
          </section>
        )}

        {/* Introduction */}
        <section className="home-section intro-section">
          <div className="section-kicker">
            WELCOME TO THE BROKIE
          </div>

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

              <a
                className="text-link"
                href="#visit"
              >
                Plan your visit ↗
              </a>
            </div>
          </div>
        </section>

        {/* Eat and drink */}
        <section
          className="home-section home-feature-grid"
          id="eat"
        >
          <article
            className="home-feature-card food-card"
            style={{
              backgroundImage: `url("${EAT_CARD_IMAGE}")`,
            }}
          >
            <div>
              <div className="eyebrow">
                EAT
              </div>

              <h3>
                Big flavour.
                <br />
                Proper portions.
              </h3>

              <p>
                Pub favourites, steaks, burgers and rotating chef
                specials, cooked fresh and made to satisfy.
              </p>

              <a
                className="button light"
                href="/order"
              >
                View menu and order
              </a>
            </div>
          </article>

          <article
            className="home-feature-card bar-card"
            style={{
              backgroundImage: `url("${BAR_CARD_IMAGE}")`,
            }}
          >
            <div>
              <div className="eyebrow">
                DRINK
              </div>

              <h3>
                Your local,
                <br />
                poured right.
              </h3>

              <p>
                Cold taps, classic spirits and easygoing service
                from open until late.
              </p>

              <a
                className="button light"
                href="#visit"
              >
                See venue details
              </a>
            </div>
          </article>
        </section>

        {/* Dynamic live sport */}
        <UpcomingSports
          fixtures={upcomingSports}
          phoneHref={phoneHref}
          bookingUrl={
            BOOKINGS_AVAILABLE
              ? BOOKING_URL
              : undefined
          }
          timezone="Australia/Perth"
        />

        {/* Book a table */}
        <section
          className="home-section booking-section"
          id="book"
        >
          <div
            className="booking-visual"
            style={{
              backgroundImage: `url("${BOOKING_IMAGE}")`,
            }}
          >
            <div className="booking-visual-overlay" />

            <div className="booking-visual-copy">
              <span className="booking-pill">
                TABLE RESERVATIONS
              </span>

              <h2>
                Your table is
                <br />
                waiting.
              </h2>

              <p>
                Lunch, dinner, family gatherings or a relaxed night
                at the local. Reserve your table in a few quick
                steps.
              </p>

              <div className="booking-highlights">
                <span>
                  <b>01</b>
                  Choose a date
                </span>

                <span>
                  <b>02</b>
                  Select your time
                </span>

                <span>
                  <b>03</b>
                  Confirm instantly
                </span>
              </div>
            </div>
          </div>

          <div className="booking-panel">
            <div className="section-kicker">
              BOOK A TABLE
            </div>

            <h3>
              Make your next visit easy.
            </h3>

            <p>
              Reserve online for lunch, dinner or a casual catch-up.
              For large groups or special requests, call the hotel
              directly.
            </p>

            <div className="booking-details-grid">
              <div>
                <small>LOCATION</small>

                <strong>
                  Broken Hill Hotel
                </strong>

                <span>
                  {settings.address}
                </span>
              </div>

              <div>
                <small>PHONE BOOKINGS</small>

                <strong>
                  {settings.phone}
                </strong>

                <span>
                  Large groups welcome
                </span>
              </div>
            </div>

            {BOOKINGS_AVAILABLE ? (
              <>
                <a
                  className="button booking-primary-button"
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Find a table
                  <span aria-hidden="true">
                    ↗
                  </span>
                </a>

                <a
                  className="booking-call-link"
                  href={phoneHref}
                >
                  Prefer to call? {settings.phone}
                </a>
              </>
            ) : (
              <div className="booking-coming-soon">
                <span>
                  ONLINE BOOKINGS COMING SOON
                </span>

                <p>
                  Online reservations are being prepared. Call us
                  now and our team will arrange your table.
                </p>

                <a
                  className="button booking-primary-button"
                  href={phoneHref}
                >
                  Call to reserve
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Embedded booking widget */}
        {BOOKINGS_AVAILABLE && (
          <section className="home-section booking-widget-section">
            <div className="booking-widget-heading">
              <div>
                <div className="section-kicker">
                  LIVE AVAILABILITY
                </div>

                <h2>
                  Reserve without leaving the site.
                </h2>
              </div>

              <a
                className="text-link"
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open booking page ↗
              </a>
            </div>

            <div className="booking-frame-wrapper">
              <iframe
                className="booking-frame"
                src={BOOKING_URL}
                title="Book a table at Broken Hill Hotel"
                loading="lazy"
                allow="payment"
              />
            </div>

            <div className="booking-mobile-fallback">
              <div>
                <span className="booking-mobile-icon">
                  ◷
                </span>

                <div>
                  <h3>
                    Book in a few taps.
                  </h3>

                  <p>
                    Check live availability and confirm your table
                    securely.
                  </p>
                </div>
              </div>

              <a
                className="button dark"
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Book now
              </a>
            </div>
          </section>
        )}

        {/* Specials */}
        {specials.length > 0 && (
          <SpecialsSlider
            specials={specials.map(
              (special) => ({
                id: special.id,
                title: special.title,
                description:
                  special.description,
                price:
                  special.price === null
                    ? null
                    : Number(special.price),
                day: special.day,
                badge: special.badge,
                imageUrl: special.imageUrl,
              }),
            )}
          />
        )}

        {/* Favourites */}
        {favouriteItems.length > 0 && (
          <section className="home-section favourites-section">
            <div className="home-section-head">
              <div>
                <div className="section-kicker">
                  BROKIE FAVOURITES
                </div>

                <h2>
                  What are you hungry for?
                </h2>
              </div>

              <a
                className="button dark"
                href="/order"
              >
                Full online menu
              </a>
            </div>

            <div className="favourite-grid">
              {favouriteItems.map((item) => (
                <article
                  className="favourite-card"
                  key={item.id}
                >
                  <div
                    className="favourite-image"
                    style={{
                      backgroundImage: `url("${item.imageUrl}")`,
                    }}
                  />

                  <div className="favourite-info">
                    <div>
                      <h3>{item.name}</h3>

                      {item.description && (
                        <p>{item.description}</p>
                      )}

                      {Array.isArray(item.dietary) &&
                        item.dietary.length > 0 && (
                          <div className="tags">
                            {item.dietary.map((tag) => (
                              <span
                                className="tag"
                                key={tag}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>

                    <strong>
                      {money(item.priceCents)}
                    </strong>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Accommodation */}
        <section
          className="home-section stay-section"
          id="stay"
        >
          <div className="stay-photo">
            <span>
              ROOMS AVAILABLE
            </span>
          </div>

          <div className="stay-copy">
            <div className="section-kicker">
              STAY AT THE BROKIE
            </div>

            <h2>
              Simple, comfortable,
              convenient.
            </h2>

            <p>
              Whether you are in town for work, passing through the
              Goldfields or staying for the weekend, settle into
              practical accommodation close to everything you need.
            </p>

            <div className="amenity-grid">
              <span>✓ Free Wi-Fi</span>
              <span>✓ On-site bar and dining</span>
              <span>✓ Easy parking</span>
              <span>✓ Central Boulder location</span>
            </div>

            <a
              className="button"
              href={phoneHref}
            >
              Call to book a room
            </a>
          </div>
        </section>

        {/* What's on */}
        <section
          className="home-section whats-on-section"
          id="whats-on"
        >
          <div className="section-kicker">
            WHAT&apos;S ON
          </div>

          <h2>
            There is always a reason to drop in.
          </h2>

          <div className="event-list">
            <article>
              <div className="event-date">
                <strong>WED</strong>
                <span>WEEKLY</span>
              </div>

              <div>
                <h3>
                  Midweek Meal Deal
                </h3>

                <p>
                  A rotating pub favourite at a locals-friendly
                  price.
                </p>
              </div>

              <a href={phoneHref}>
                Enquire →
              </a>
            </article>

            <article>
              <div className="event-date">
                <strong>FRI</strong>
                <span>WEEKLY</span>
              </div>

              <div>
                <h3>
                  Friday Knock-Offs
                </h3>

                <p>
                  Cold drinks, good company and the weekend starts
                  here.
                </p>
              </div>

              <a href="#visit">
                Get directions →
              </a>
            </article>

            <article>
              <div className="event-date">
                <strong>LIVE</strong>
                <span>SPORT</span>
              </div>

              <div>
                <h3>
                  Big Games on Screen
                </h3>

                <p>
                  Browse upcoming fixtures scheduled at the hotel.
                </p>
              </div>

              <a href="#live-sport">
                View fixtures →
              </a>
            </article>
          </div>
        </section>

        {/* Order banner */}
        <section className="home-order-banner">
          <div>
            <div className="eyebrow dark-text">
              SKIP THE QUEUE
            </div>

            <h2>
              Dinner sorted in a few taps.
            </h2>

            <p>
              Browse the menu, choose your pickup time and place
              your order directly with the hotel.
            </p>
          </div>

          <a
            className="button dark"
            href="/order"
          >
            Start an order
          </a>
        </section>

        {/* Gift cards */}
        <section
          className="home-section gift-card-section"
          id="gift-cards"
        >
          <div className="gift-card-heading">
            <div>
              <div className="section-kicker">
                BROKEN HILL HOTEL GIFT CARDS
              </div>

              <h2>
                Give the gift of
                <br />
                good times.
              </h2>
            </div>

            <div className="gift-card-intro">
              {GIFT_CARDS_AVAILABLE ? (
                <>
                  <p>
                    Treat someone special to great food, cold drinks
                    and a memorable visit to the Broken Hill Hotel.
                  </p>

                  <div className="gift-card-benefits">
                    <span>✓ Choose your amount</span>
                    <span>✓ Add a personal message</span>
                    <span>✓ Send instantly by email</span>
                  </div>

                  <a
                    className="text-link"
                    href={GIFT_CARD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open gift cards in a new window ↗
                  </a>
                </>
              ) : (
                <p>
                  Digital gift cards are currently being prepared
                  and will be available soon.
                </p>
              )}
            </div>
          </div>

          {GIFT_CARDS_AVAILABLE ? (
            <div className="gift-card-live-card">
              <div className="gift-card-preview">
                <span className="gift-card-preview-mark">
                  BH
                </span>

                <div>
                  <strong>
                    Broken Hill Hotel
                  </strong>

                  <small>
                    Gift Card
                  </small>
                </div>

                <span className="gift-card-preview-year">
                  EST. 1899
                </span>
              </div>

              <div className="gift-card-live-copy">
                <span className="coming-soon-badge">
                  AVAILABLE ONLINE
                </span>

                <h3>
                  A gift they will actually use.
                </h3>

                <p>
                  Select an amount, add your message and send it
                  directly to their inbox.
                </p>

                <a
                  className="button dark"
                  href={GIFT_CARD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Buy a gift card
                </a>
              </div>
            </div>
          ) : (
            <div className="gift-card-coming-soon">
              <div className="gift-card-coming-soon-icon">
                🎁
              </div>

              <div className="gift-card-coming-soon-copy">
                <span className="coming-soon-badge">
                  COMING SOON
                </span>

                <h3>
                  Broken Hill Hotel gift cards are on the way.
                </h3>

                <p>
                  Soon you will be able to purchase digital gift
                  cards for meals, drinks and memorable nights at
                  the Brokie.
                </p>

                <a
                  className="button dark"
                  href={phoneHref}
                >
                  Call us for gift enquiries
                </a>
              </div>
            </div>
          )}
        </section>

        {/* Visit */}
        <section
          className="home-section visit-section"
          id="visit"
        >
          <div>
            <div className="section-kicker">
              FIND US
            </div>

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
                  <a href={phoneHref}>
                    {settings.phone}
                  </a>
                </p>
              </div>

              <div>
                <small>ORDERING</small>

                <p>
                  {settings.isOrderingOpen
                    ? "Online ordering open"
                    : "Online ordering closed"}
                  <br />
                  Typical pickup{" "}
                  {settings.pickupMinutes} minutes
                </p>
              </div>

              <div>
                <small>BOOKINGS</small>

                <p>
                  <a
                    href={bookingHref}
                    target={
                      BOOKINGS_AVAILABLE
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      BOOKINGS_AVAILABLE
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    {BOOKINGS_AVAILABLE
                      ? "Book a table ↗"
                      : "Call to reserve"}
                  </a>
                </p>
              </div>

              <div>
                <small>LIVE SPORT</small>

                <p>
                  <a href="#live-sport">
                    View upcoming fixtures
                  </a>
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
              href={mapsHref}
            >
              Get directions
            </a>
          </div>

          <div className="map-panel">
            <div className="map-pin">
              BH
            </div>

            <div className="map-label">
              <strong>
                {settings.venueName}
              </strong>

              <span>
                {settings.address}
              </span>
            </div>
          </div>
        </section>
      </main>

      <a
        className="floating-booking-button"
        href={bookingHref}
        target={
          BOOKINGS_AVAILABLE
            ? "_blank"
            : undefined
        }
        rel={
          BOOKINGS_AVAILABLE
            ? "noopener noreferrer"
            : undefined
        }
      >
        <span className="floating-booking-icon">
          ◷
        </span>

        <span>
          <small>
            {BOOKINGS_AVAILABLE
              ? "RESERVE ONLINE"
              : "PHONE BOOKINGS"}
          </small>

          {BOOKINGS_AVAILABLE
            ? "Book a table"
            : "Call to reserve"}
        </span>
      </a>

      <footer className="home-footer">
        <div className="brand">
          <span className="mark">
            BH
          </span>

          <span>
            {settings.venueName}

            <small>
              YOUR LOCAL SINCE 1899
            </small>
          </span>
        </div>

        <div className="footer-links">
          <a href="#eat">
            Eat
          </a>

          <a href="#live-sport">
            Live Sport
          </a>

          <a href="#book">
            Book a Table
          </a>

          <a href="#stay">
            Stay
          </a>

          <a href="#whats-on">
            What&apos;s On
          </a>

          <a href="#gift-cards">
            Gift Cards
          </a>

          <a href="#visit">
            Contact
          </a>

          <a href="/order">
            Order online
          </a>
        </div>

        <p>
          © {new Date().getFullYear()}{" "}
          {settings.venueName} • Drink responsibly • 18+
        </p>
      </footer>
    </>
  );
}