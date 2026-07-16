export type SportsFixture = {
  id: string;
  league: string;
  category: string;
  homeTeam: string;
  awayTeam?: string | null;
  startsAt: string;
  soundOn?: boolean;
  featured?: boolean;
  bookingUrl?: string | null;
};

type UpcomingSportsProps = {
  fixtures: SportsFixture[];
  bookingUrl?: string;
  phoneHref: string;
  timezone?: string;
};

function sportIcon(category: string) {
  const value = category.toLowerCase();

  if (
    value.includes("afl") ||
    value.includes("nrl") ||
    value.includes("rugby")
  ) {
    return "🏉";
  }

  if (
    value.includes("football") ||
    value.includes("soccer") ||
    value.includes("epl")
  ) {
    return "⚽";
  }

  if (
    value.includes("ufc") ||
    value.includes("mma")
  ) {
    return "🥋";
  }

  if (value.includes("boxing")) {
    return "🥊";
  }

  if (
    value.includes("formula") ||
    value.includes("f1") ||
    value.includes("motor")
  ) {
    return "🏎️";
  }

  if (
    value.includes("basketball") ||
    value.includes("nba")
  ) {
    return "🏀";
  }

  if (value.includes("tennis")) {
    return "🎾";
  }

  if (value.includes("cricket")) {
    return "🏏";
  }

  if (
    value.includes("horse") ||
    value.includes("racing")
  ) {
    return "🏇";
  }

  return "📺";
}

function getFixtureStatus(
  startsAt: string,
  timezone: string,
): "LIVE" | "TODAY" | "TOMORROW" | "THIS WEEK" {
  const start = new Date(startsAt);
  const now = new Date();

  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const fixtureDate = dateFormatter.format(start);
  const todayDate = dateFormatter.format(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowDate = dateFormatter.format(tomorrow);

  const assumedDurationMs = 3 * 60 * 60 * 1000;

  if (
    now.getTime() >= start.getTime() &&
    now.getTime() <= start.getTime() + assumedDurationMs
  ) {
    return "LIVE";
  }

  if (fixtureDate === todayDate) {
    return "TODAY";
  }

  if (fixtureDate === tomorrowDate) {
    return "TOMORROW";
  }

  return "THIS WEEK";
}

function formatFixtureDate(
  startsAt: string,
  timezone: string,
) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(new Date(startsAt));
}

function formatFixtureTime(
  startsAt: string,
  timezone: string,
) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(startsAt));
}

export default function UpcomingSports({
  fixtures,
  bookingUrl,
  phoneHref,
  timezone = "Australia/Perth",
}: UpcomingSportsProps) {
  const now = Date.now();

  const upcomingFixtures = fixtures
    .filter((fixture) => {
      const startTime = new Date(fixture.startsAt).getTime();

      // Keep currently live events and future events.
      return startTime + 3 * 60 * 60 * 1000 >= now;
    })
    .sort((a, b) => {
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }

      return (
        new Date(a.startsAt).getTime() -
        new Date(b.startsAt).getTime()
      );
    })
    .slice(0, 7);

  if (upcomingFixtures.length === 0) {
    return (
      <section
        className="home-section sports-section"
        id="live-sport"
      >
        <div className="sports-empty">
          <span className="sports-live-dot" />

          <div>
            <div className="section-kicker sports-kicker">
              LIVE SPORT
            </div>

            <h2>New fixtures are being prepared.</h2>

            <p>
              Call the hotel to ask which games, fights and races
              are showing live this week.
            </p>
          </div>

          <a
            className="button sports-button"
            href={phoneHref}
          >
            Ask what&apos;s showing
          </a>
        </div>
      </section>
    );
  }

  const featuredFixture =
    upcomingFixtures.find((fixture) => fixture.featured) ??
    upcomingFixtures[0];

  const remainingFixtures = upcomingFixtures.filter(
    (fixture) => fixture.id !== featuredFixture.id,
  );

  const defaultReserveHref = bookingUrl || phoneHref;

  const featuredReserveHref =
    featuredFixture.bookingUrl ||
    defaultReserveHref;

  const featuredOpensExternally = Boolean(
    featuredFixture.bookingUrl || bookingUrl,
  );

  const featuredStatus = getFixtureStatus(
    featuredFixture.startsAt,
    timezone,
  );

  return (
    <section
      className="home-section sports-section"
      id="live-sport"
    >
      <div className="sports-section-header">
        <div>
          <div className="section-kicker sports-kicker">
            LIVE SPORT AT THE BROKIE
          </div>

          <h2>
            Big games.
            <br />
            Bigger screens.
          </h2>
        </div>

        <div className="sports-header-copy">
          <p>
            See the upcoming sport scheduled at the Broken Hill
            Hotel. Times are automatically displayed in Western
            Australian local time.
          </p>

          <div className="sports-venue-features">
            <span>Multiple screens</span>
            <span>Cold beer</span>
            <span>Kitchen open</span>
            <span>Selected events with sound</span>
          </div>
        </div>
      </div>

      <div className="sports-layout">
        <article className="featured-sport-card">
          <div className="featured-sport-top">
            <div className="sport-category">
              <span className="sport-category-icon">
                {sportIcon(featuredFixture.category)}
              </span>

              <div>
                <small>
                  {featuredFixture.category}
                </small>

                <strong>
                  {featuredFixture.league}
                </strong>
              </div>
            </div>

            <span
              className={`sport-status sport-status-${featuredStatus
                .toLowerCase()
                .replaceAll(" ", "-")}`}
            >
              {featuredStatus === "LIVE" && (
                <span className="sport-live-pulse" />
              )}

              {featuredStatus}
            </span>
          </div>

          <div className="featured-sport-content">
            <div className="featured-sport-date">
              <span>
                {formatFixtureDate(
                  featuredFixture.startsAt,
                  timezone,
                )}
              </span>

              <strong>
                {formatFixtureTime(
                  featuredFixture.startsAt,
                  timezone,
                )}
              </strong>
            </div>

            <h3>
              {featuredFixture.homeTeam}

              {featuredFixture.awayTeam && (
                <>
                  <span>vs</span>
                  {featuredFixture.awayTeam}
                </>
              )}
            </h3>

            <div className="featured-sport-details">
              <span>Live on the big screens</span>

              {featuredFixture.soundOn && (
                <span className="sound-on-badge">
                  Sound on
                </span>
              )}
            </div>
          </div>

          <div className="featured-sport-actions">
            <a
              className="button sports-gold-button"
              href={featuredReserveHref}
              target={
                featuredOpensExternally
                  ? "_blank"
                  : undefined
              }
              rel={
                featuredOpensExternally
                  ? "noopener noreferrer"
                  : undefined
              }
            >
              Reserve for the game
            </a>

            <a
              className="sports-order-link"
              href="/order"
            >
              Order food before kick-off →
            </a>
          </div>

          <span
            className="featured-sport-watermark"
            aria-hidden="true"
          >
            LIVE
          </span>
        </article>

        <div className="sports-fixture-list">
          {remainingFixtures.map((fixture) => {
            const status = getFixtureStatus(
              fixture.startsAt,
              timezone,
            );

            const fixtureReserveHref =
              fixture.bookingUrl ||
              defaultReserveHref;

            const opensExternally = Boolean(
              fixture.bookingUrl || bookingUrl,
            );

            return (
              <article
                className="sport-fixture-card"
                key={fixture.id}
              >
                <div className="sport-fixture-icon">
                  {sportIcon(fixture.category)}
                </div>

                <div className="sport-fixture-main">
                  <div className="sport-fixture-meta">
                    <span>{fixture.league}</span>

                    <strong
                      className={
                        status === "LIVE"
                          ? "fixture-live-label"
                          : undefined
                      }
                    >
                      {status}
                    </strong>
                  </div>

                  <h3>
                    {fixture.homeTeam}

                    {fixture.awayTeam && (
                      <span>
                        {" "}
                        vs {fixture.awayTeam}
                      </span>
                    )}
                  </h3>

                  <div className="sport-fixture-time">
                    <span>
                      {formatFixtureDate(
                        fixture.startsAt,
                        timezone,
                      )}
                    </span>

                    <b>•</b>

                    <strong>
                      {formatFixtureTime(
                        fixture.startsAt,
                        timezone,
                      )}
                    </strong>

                    {fixture.soundOn && (
                      <>
                        <b>•</b>
                        <span>Sound on</span>
                      </>
                    )}
                  </div>
                </div>

                <a
                  className="sport-fixture-arrow"
                  href={fixtureReserveHref}
                  target={
                    opensExternally
                      ? "_blank"
                      : undefined
                  }
                  rel={
                    opensExternally
                      ? "noopener noreferrer"
                      : undefined
                  }
                  aria-label={`Reserve for ${fixture.homeTeam}${
                    fixture.awayTeam
                      ? ` versus ${fixture.awayTeam}`
                      : ""
                  }`}
                >
                  ↗
                </a>
              </article>
            );
          })}
        </div>
      </div>

      <div className="sports-footer-banner">
        <div>
          <span className="sports-live-dot" />

          <div>
            <small>PLANNING A BIG GAME?</small>

            <strong>
              Reserve a table and settle in before kick-off.
            </strong>
          </div>
        </div>

        <a
          className="button sports-button"
          href={defaultReserveHref}
          target={bookingUrl ? "_blank" : undefined}
          rel={
            bookingUrl
              ? "noopener noreferrer"
              : undefined
          }
        >
          {bookingUrl
            ? "Book a table"
            : "Call to reserve"}
        </a>
      </div>
    </section>
  );
}