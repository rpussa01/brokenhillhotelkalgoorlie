import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getSettings();

  return (
    <>
      <div className="announcement">
        <span>Open daily • Cold beer • Great food • Local hospitality</span>
        <a href="/order">Order food online →</a>
      </div>

      <header className="site-header">
        <a href="/" className="brand">
          <span className="mark">BH</span>
          <span>
            BROKEN HILL
            <small>HOTEL • EST. 1899</small>
          </span>
        </a>

        <nav className="site-nav">
          <a href="#eat">Eat</a>
          <a href="#stay">Stay</a>
          <a href="#whats-on">What&apos;s On</a>
          <a href="#visit">Visit</a>
          <a className="button light" href="/admin">Staff</a>
          <a className="button" href="/order">Order online</a>
        </nav>
      </header>

      <main>
        <section className="home-hero">
          <div className="home-overlay" />
          <div className="home-hero-content">
            <div className="eyebrow">THE LOCAL SINCE 1899</div>
            <h1>Good food.<br />Cold beer.<br /><em>No fuss.</em></h1>
            <p>
              A true Kalgoorlie-Boulder pub with hearty meals, welcoming rooms
              and the kind of local atmosphere you cannot manufacture.
            </p>
            <div className="home-actions">
              <a className="button" href="/order">Order food</a>
              <a className="button ghost" href="#eat">Explore the menu</a>
            </div>
          </div>
          <div className="home-meta">{settings.address} • {settings.phone}</div>
        </section>

        <section className="home-ticker">
          <span>PUBLIC BAR</span><b>✦</b>
          <span>COUNTRY PUB MEALS</span><b>✦</b>
          <span>ACCOMMODATION</span><b>✦</b>
          <span>BOTTLE SHOP</span><b>✦</b>
          <span>LIVE SPORT</span>
        </section>

        <section className="home-section intro-section">
          <div className="section-kicker">WELCOME TO THE BROKIE</div>
          <div className="intro-grid">
            <h2>Built on history.<br />Made for today.</h2>
            <div>
              <p>
                From knock-off drinks to generous pub classics, weekend catch-ups
                and a comfortable place to stay, the Broken Hill Hotel is where
                locals and travellers come together.
              </p>
              <a className="text-link" href="#visit">Plan your visit ↗</a>
            </div>
          </div>
        </section>

        <section className="home-section home-feature-grid" id="eat">
          <article className="home-feature-card food-card">
            <div>
              <div className="eyebrow">EAT</div>
              <h3>Big flavour.<br />Proper portions.</h3>
              <p>
                Pub favourites, steaks, burgers and rotating chef specials,
                cooked fresh and made to satisfy.
              </p>
              <a className="button light" href="/order">View menu and order</a>
            </div>
          </article>

          <article className="home-feature-card bar-card">
            <div>
              <div className="eyebrow">DRINK</div>
              <h3>Your local,<br />poured right.</h3>
              <p>
                Cold taps, classic spirits and easygoing service from open until late.
              </p>
              <a className="button light" href="#visit">See venue details</a>
            </div>
          </article>
        </section>

        <section className="home-section favourites-section">
          <div className="home-section-head">
            <div>
              <div className="section-kicker">BROKIE FAVOURITES</div>
              <h2>What are you hungry for?</h2>
            </div>
            <a className="button dark" href="/order">Full online menu</a>
          </div>

          <div className="favourite-grid">
            <article className="favourite-card">
              <div className="favourite-image parmi-image" />
              <div className="favourite-info">
                <div><h3>Classic Parmi</h3><p>Chicken schnitzel, Napoli, ham, mozzarella, chips and salad.</p></div>
                <strong>$28</strong>
              </div>
            </article>

            <article className="favourite-card">
              <div className="favourite-image steak-image" />
              <div className="favourite-info">
                <div><h3>250g Porterhouse</h3><p>Cooked your way with chips, salad and your choice of sauce.</p></div>
                <strong>$34</strong>
              </div>
            </article>

            <article className="favourite-card">
              <div className="favourite-image burger-image" />
              <div className="favourite-info">
                <div><h3>Brokie Burger</h3><p>Beef, bacon, cheese, pickles, house sauce and chips.</p></div>
                <strong>$24</strong>
              </div>
            </article>
          </div>
        </section>

        <section className="home-section stay-section" id="stay">
          <div className="stay-photo"><span>ROOMS AVAILABLE</span></div>
          <div className="stay-copy">
            <div className="section-kicker">STAY AT THE BROKIE</div>
            <h2>Simple, comfortable, convenient.</h2>
            <p>
              Whether you are in town for work, passing through the Goldfields,
              or staying for the weekend, settle into practical accommodation
              close to everything you need.
            </p>
            <div className="amenity-grid">
              <span>✓ Free Wi-Fi</span>
              <span>✓ On-site bar and dining</span>
              <span>✓ Easy parking</span>
              <span>✓ Central Boulder location</span>
            </div>
            <a className="button" href="tel:+61890930306">Call to book a room</a>
          </div>
        </section>

        <section className="home-section whats-on-section" id="whats-on">
          <div className="section-kicker">WHAT&apos;S ON</div>
          <h2>There is always a reason to drop in.</h2>

          <div className="event-list">
            <article>
              <div className="event-date"><strong>WED</strong><span>WEEKLY</span></div>
              <div><h3>Midweek Meal Deal</h3><p>A rotating pub favourite at a locals-friendly price.</p></div>
              <a href="tel:+61890930306">Enquire →</a>
            </article>

            <article>
              <div className="event-date"><strong>FRI</strong><span>WEEKLY</span></div>
              <div><h3>Friday Knock-Offs</h3><p>Cold drinks, good company and the weekend starts here.</p></div>
              <a href="#visit">Get directions →</a>
            </article>

            <article>
              <div className="event-date"><strong>LIVE</strong><span>SPORT</span></div>
              <div><h3>Big Games on Screen</h3><p>Catch major fixtures live in the public bar.</p></div>
              <a href="tel:+61890930306">Check schedule →</a>
            </article>
          </div>
        </section>

        <section className="home-order-banner">
          <div>
            <div className="eyebrow dark-text">SKIP THE QUEUE</div>
            <h2>Dinner sorted in a few taps.</h2>
            <p>Browse the menu, choose your pickup time and place your order directly with the hotel.</p>
          </div>
          <a className="button dark" href="/order">Start an order</a>
        </section>

        <section className="home-section visit-section" id="visit">
          <div>
            <div className="section-kicker">FIND US</div>
            <h2>Better at<br />the Brokie.</h2>

            <div className="visit-grid">
              <div><small>ADDRESS</small><p>{settings.address}</p></div>
              <div><small>PHONE</small><p><a href="tel:+61890930306">{settings.phone}</a></p></div>
              <div><small>ORDERING</small><p>{settings.isOrderingOpen ? "Online ordering open" : "Online ordering closed"}<br />Typical pickup {settings.pickupMinutes} minutes</p></div>
              <div><small>SOCIAL</small><p><a href="https://www.instagram.com/thebrokenhillkalgoorlie/" target="_blank" rel="noreferrer">Instagram ↗</a></p></div>
            </div>

            <a
              className="button"
              target="_blank"
              rel="noreferrer"
              href="https://www.google.com/maps/search/?api=1&query=21+Forrest+Street+South+Boulder+WA+6432"
            >
              Get directions
            </a>
          </div>

          <div className="map-panel">
            <div className="map-pin">BH</div>
            <div className="map-label">
              <strong>BROKEN HILL HOTEL</strong>
              <span>21 Forrest Street, South Boulder</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="brand">
          <span className="mark">BH</span>
          <span>BROKEN HILL<small>YOUR LOCAL SINCE 1899</small></span>
        </div>
        <div className="footer-links">
          <a href="#eat">Eat</a>
          <a href="#stay">Stay</a>
          <a href="#whats-on">What&apos;s On</a>
          <a href="#visit">Contact</a>
          <a href="/order">Order Online</a>
        </div>
        <p>© {new Date().getFullYear()} Broken Hill Hotel • Drink responsibly • 18+</p>
      </footer>
    </>
  );
}
