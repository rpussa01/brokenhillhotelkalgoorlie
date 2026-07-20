import Link from "next/link";

type IconProps = {
  className?: string;
};

function MenuIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="24"
      height="24"
    >
      <path d="M5 4h14v16H5z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function BagIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="24"
      height="24"
    >
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export default function MenuQuickNav() {
  return (
    <section
      className="menu-quick-nav"
      aria-label="Food and venue navigation"
    >
      <div className="menu-quick-nav-inner">
        <div className="menu-quick-nav-copy">
          <span>Hungry?</span>

          <strong>
            Choose how you&apos;d like to view the menu.
          </strong>
        </div>

        <div className="menu-quick-nav-actions">
          <Link
            className="menu-quick-link dine-in"
            href="/menu"
          >
            <span className="menu-quick-icon" aria-hidden="true">
              <MenuIcon className="menu-quick-svg" />
            </span>

            <span className="menu-quick-link-copy">
              <small>FULL VENUE MENU</small>
              <strong>View dine-in menu</strong>
            </span>

            <span className="menu-quick-arrow" aria-hidden="true">
              →
            </span>
          </Link>

          <Link
            className="menu-quick-link takeaway"
            href="/order"
          >
            <span className="menu-quick-icon" aria-hidden="true">
              <BagIcon className="menu-quick-svg" />
            </span>

            <span className="menu-quick-link-copy">
              <small>PICKUP ORDERING</small>
              <strong>Order takeaway</strong>
            </span>

            <span className="menu-quick-arrow" aria-hidden="true">
              →
            </span>
          </Link>

          <a className="menu-quick-anchor" href="#book">
            Book
          </a>

          <a className="menu-quick-anchor" href="#live-sport">
            Live sport
          </a>
        </div>
      </div>
    </section>
  );
}