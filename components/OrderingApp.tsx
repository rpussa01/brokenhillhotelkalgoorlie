"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Category,
  MenuItem,
  Settings,
} from "@/lib/types";

type Special = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  day: string | null;
  badge: string | null;
  imageUrl: string | null;
};

type OrderingAppProps = {
  categories: Category[];
  items: MenuItem[];
  settings: Settings;
  specials: Special[];
};

type Cart = Record<string, number>;

type PaymentMethod = "ONLINE" | "PICKUP";

type KitchenStatus = {
  isOpen: boolean;
  closedTitle: string;
  closedNote: string;
  updatedAt?: string;
};

type CartLine =
  | {
      cartId: string;
      type: "MENU_ITEM";
      id: string;
      name: string;
      priceCents: number;
      quantity: number;
    }
  | {
      cartId: string;
      type: "SPECIAL";
      id: string;
      name: string;
      priceCents: number;
      quantity: number;
    };

type OrderResponse = {
  orderId?: string;
  checkoutUrl?: string;
  error?: string;
  message?: string;
  code?: string;
};

const MENU_FALLBACK_IMAGE =
  "/images/menu-placeholder.jpg";

const SPECIAL_FALLBACK_IMAGE =
  "/images/special-placeholder.jpg";

const DEFAULT_CLOSED_TITLE =
  "Kitchen currently closed";

const DEFAULT_CLOSED_NOTE =
  "Online ordering is unavailable right now. Please check again later.";

const money = (cents: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
      />

      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />

      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 4h14v16H5z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

export default function OrderingApp({
  categories,
  items,
  settings,
  specials,
}: OrderingAppProps) {
  const [cart, setCart] = useState<Cart>({});
  const [checkout, setCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("ONLINE");

  const [kitchenStatus, setKitchenStatus] =
    useState<KitchenStatus | null>(null);

  const [checkingKitchen, setCheckingKitchen] =
    useState(true);

  const [kitchenCheckError, setKitchenCheckError] =
    useState(false);

  const kitchenIsOpen =
    settings.isOrderingOpen &&
    kitchenStatus?.isOpen === true;

  const kitchenIsClosed =
    !checkingKitchen && !kitchenIsOpen;

  const closedTitle =
    kitchenStatus?.closedTitle ||
    DEFAULT_CLOSED_TITLE;

  const closedNote =
    kitchenStatus?.closedNote ||
    DEFAULT_CLOSED_NOTE;

  const checkKitchenStatus =
    useCallback(async (): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/kitchen-status?t=${Date.now()}`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              accept: "application/json",
            },
          },
        );

        const result = (await response
          .json()
          .catch(() => null)) as KitchenStatus | null;

        if (!response.ok || !result) {
          throw new Error(
            "Could not confirm kitchen availability.",
          );
        }

        setKitchenStatus({
          isOpen: result.isOpen === true,
          closedTitle:
            result.closedTitle || DEFAULT_CLOSED_TITLE,
          closedNote:
            result.closedNote || DEFAULT_CLOSED_NOTE,
          updatedAt: result.updatedAt,
        });

        setKitchenCheckError(false);

        return (
          settings.isOrderingOpen &&
          result.isOpen === true
        );
      } catch (caughtError) {
        console.error(
          "Kitchen status check failed:",
          caughtError,
        );

        /*
         * Fail closed:
         * if the website cannot confirm the kitchen status,
         * customers cannot place an order.
         */
        setKitchenStatus({
          isOpen: false,
          closedTitle:
            "Ordering temporarily unavailable",
          closedNote:
            "We could not confirm that the kitchen is open. Please try again shortly or contact the hotel.",
        });

        setKitchenCheckError(true);

        return false;
      } finally {
        setCheckingKitchen(false);
      }
    }, [settings.isOrderingOpen]);

  useEffect(() => {
    void checkKitchenStatus();

    const timer = window.setInterval(() => {
      void checkKitchenStatus();
    }, 20_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [checkKitchenStatus]);

  useEffect(() => {
    if (kitchenIsClosed && checkout) {
      setCheckout(false);
      setError(
        kitchenStatus?.closedNote ||
          DEFAULT_CLOSED_NOTE,
      );
    }
  }, [
    checkout,
    kitchenIsClosed,
    kitchenStatus?.closedNote,
  ]);

  const activeCategories = useMemo(
    () =>
      categories
        .filter((category) => category.active)
        .sort(
          (first, second) =>
            first.sortOrder - second.sortOrder ||
            first.name.localeCompare(second.name),
        ),
    [categories],
  );

  const availableItems = useMemo(
    () =>
      items
        .filter((item) => item.active)
        .sort(
          (first, second) =>
            first.sortOrder - second.sortOrder ||
            first.name.localeCompare(second.name),
        ),
    [items],
  );

  const availableSpecials = useMemo(
    () =>
      specials.filter(
        (special) => special.price !== null,
      ),
    [specials],
  );

  const cartLines = useMemo<CartLine[]>(() => {
    return Object.entries(cart)
      .map(([cartId, quantity]) => {
        if (cartId.startsWith("item:")) {
          const itemId = cartId.replace("item:", "");

          const item = availableItems.find(
            (candidate) => candidate.id === itemId,
          );

          if (!item) {
            return null;
          }

          return {
            cartId,
            type: "MENU_ITEM" as const,
            id: item.id,
            name: item.name,
            priceCents: item.priceCents,
            quantity,
          };
        }

        if (cartId.startsWith("special:")) {
          const specialId = cartId.replace(
            "special:",
            "",
          );

          const special = availableSpecials.find(
            (candidate) => candidate.id === specialId,
          );

          if (
            !special ||
            special.price === null
          ) {
            return null;
          }

          return {
            cartId,
            type: "SPECIAL" as const,
            id: special.id,
            name: special.title,
            priceCents: Math.round(
              special.price * 100,
            ),
            quantity,
          };
        }

        return null;
      })
      .filter(
        (line): line is CartLine => line !== null,
      );
  }, [cart, availableItems, availableSpecials]);

  const total = useMemo(
    () =>
      cartLines.reduce(
        (sum, line) =>
          sum +
          line.priceCents * line.quantity,
        0,
      ),
    [cartLines],
  );

  const itemCount = useMemo(
    () =>
      cartLines.reduce(
        (sum, line) => sum + line.quantity,
        0,
      ),
    [cartLines],
  );

  const firstPickup = useMemo(() => {
    const date = new Date(
      Date.now() +
        settings.pickupMinutes * 60_000,
    );

    date.setMinutes(
      Math.ceil(date.getMinutes() / 5) * 5,
      0,
      0,
    );

    const localDate = new Date(
      date.getTime() -
        date.getTimezoneOffset() * 60_000,
    );

    return localDate
      .toISOString()
      .slice(0, 16);
  }, [settings.pickupMinutes]);

  function change(
    cartId: string,
    delta: number,
  ) {
    if (delta > 0 && !kitchenIsOpen) {
      setError(
        kitchenStatus?.closedNote ||
          "The kitchen is currently closed.",
      );

      return;
    }

    setError("");

    setCart((current) => {
      const next = {
        ...current,
        [cartId]:
          (current[cartId] || 0) + delta,
      };

      if (next[cartId] <= 0) {
        delete next[cartId];
      }

      return next;
    });
  }

  async function openCheckout() {
    setError("");

    if (!cartLines.length) {
      setError(
        "Add at least one item before checking out.",
      );

      return;
    }

    setCheckingKitchen(true);

    const isOpen = await checkKitchenStatus();

    if (!isOpen) {
      setError(
        kitchenStatus?.closedNote ||
          "Online ordering is currently closed.",
      );

      return;
    }

    setCheckout(true);
  }

  function closeCheckout() {
    if (submitting) {
      return;
    }

    setCheckout(false);
    setError("");
  }

  async function submitOrder(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!cartLines.length) {
      setError(
        "Your cart is empty. Please add an item.",
      );

      return;
    }

    setSubmitting(true);
    setError("");

    /*
     * Recheck immediately before creating the order.
     * This handles the kitchen closing while checkout is open.
     */
    const isOpen = await checkKitchenStatus();

    if (!isOpen) {
      setSubmitting(false);
      setCheckout(false);

      setError(
        kitchenStatus?.closedNote ||
          "The kitchen has closed and cannot accept this order.",
      );

      return;
    }

    const formData = new FormData(
      event.currentTarget,
    );

    const customerName = String(
      formData.get("customerName") || "",
    ).trim();

    const customerPhone = String(
      formData.get("customerPhone") || "",
    ).trim();

    const customerEmail = String(
      formData.get("customerEmail") || "",
    ).trim();

    const pickupTime = String(
      formData.get("pickupTime") || "",
    ).trim();

    const notes = String(
      formData.get("notes") || "",
    ).trim();

    if (!customerName || !customerPhone) {
      setError(
        "Please enter your name and mobile number.",
      );

      setSubmitting(false);
      return;
    }

    if (
      paymentMethod === "ONLINE" &&
      !customerEmail
    ) {
      setError(
        "Please enter your email for the Stripe payment receipt.",
      );

      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail:
            customerEmail || null,
          pickupTime,
          notes: notes || null,
          paymentMethod,
          lines: cartLines.map((line) => ({
            itemId:
              line.type === "MENU_ITEM"
                ? line.id
                : undefined,

            specialId:
              line.type === "SPECIAL"
                ? line.id
                : undefined,

            quantity: line.quantity,
          })),
        }),
      });

      const result = (await response
        .json()
        .catch(() => null)) as
        | OrderResponse
        | null;

      if (!response.ok) {
        if (
          result?.code === "KITCHEN_CLOSED"
        ) {
          setKitchenStatus((current) => ({
            isOpen: false,
            closedTitle:
              result.error ||
              current?.closedTitle ||
              DEFAULT_CLOSED_TITLE,
            closedNote:
              result.message ||
              current?.closedNote ||
              DEFAULT_CLOSED_NOTE,
          }));

          setCheckout(false);
        }

        throw new Error(
          result?.message ||
            result?.error ||
            "Could not place order.",
        );
      }

      if (paymentMethod === "ONLINE") {
        if (!result?.checkoutUrl) {
          throw new Error(
            "Stripe checkout was not created. Check the order API and Stripe settings.",
          );
        }

        window.location.assign(
          result.checkoutUrl,
        );

        return;
      }

      if (!result?.orderId) {
        throw new Error(
          "Order was created without an order ID.",
        );
      }

      window.location.assign(
        `/order-success?id=${encodeURIComponent(
          result.orderId,
        )}`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not place order.",
      );

      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <a className="brand" href="/">
          <span className="mark">BH</span>

          <span>
            BROKEN HILL
            <small>HOTEL • EST. 1899</small>
          </span>
        </a>

        <nav className="nav">
          <a href="/">Home</a>
          <a href="/admin">Staff login</a>

          <a
            className="button"
            href="tel:+61890930306"
          >
            Call hotel
          </a>
        </nav>
      </header>

      <section
        className={`hero ordering-hero ${
          kitchenIsClosed
            ? "ordering-hero-closed"
            : ""
        }`}
      >
        <div className="hero-grid">
          <div>
            <div className="eyebrow">
              ORDER DIRECT • PICKUP
            </div>

            <h1>
              {kitchenIsClosed
                ? closedTitle
                : "Dinner sorted."}
            </h1>

            <p>
              {kitchenIsClosed
                ? closedNote
                : "Order pub favourites directly from the Broken Hill Hotel and collect from South Boulder."}
            </p>
          </div>

          <div
            className={`open-card ${
              kitchenIsClosed ? "is-closed" : ""
            }`}
          >
            <span
              className={`dot ${
                kitchenIsOpen ? "" : "closed"
              }`}
            />

            <div>
              <strong>
                {checkingKitchen
                  ? "Checking kitchen…"
                  : kitchenIsOpen
                    ? "Kitchen open"
                    : "Kitchen closed"}
              </strong>

              <p>
                {checkingKitchen
                  ? "Confirming availability"
                  : kitchenIsOpen
                    ? `Typical pickup: ${settings.pickupMinutes} minutes`
                    : "New online orders are unavailable"}
              </p>
            </div>

            {kitchenCheckError && (
              <button
                type="button"
                className="status-retry-button"
                onClick={() => {
                  setCheckingKitchen(true);
                  void checkKitchenStatus();
                }}
              >
                Check again
              </button>
            )}
          </div>
        </div>
      </section>

      {kitchenIsClosed && (
        <section
          className="customer-kitchen-closed-banner"
          role="status"
        >
          <div className="customer-kitchen-closed-icon">
            Closed
          </div>

          <div>
            <strong>{closedTitle}</strong>
            <p>{closedNote}</p>
          </div>

          <div className="customer-kitchen-closed-actions">
            <button
              type="button"
              onClick={() => {
                setCheckingKitchen(true);
                void checkKitchenStatus();
              }}
              disabled={checkingKitchen}
            >
              {checkingKitchen
                ? "Checking…"
                : "Check again"}
            </button>

            <a href="tel:+61890930306">
              Call hotel
            </a>
          </div>
        </section>
      )}

      <div className="category-tabs">
        {availableSpecials.length > 0 && (
          <button
            type="button"
            className="active"
            onClick={() =>
              document
                .getElementById(
                  "order-specials",
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            Specials
          </button>
        )}

        {activeCategories.map(
          (category, index) => (
            <button
              type="button"
              className={
                availableSpecials.length === 0 &&
                index === 0
                  ? "active"
                  : ""
              }
              key={category.id}
              onClick={() =>
                document
                  .getElementById(category.id)
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              {category.name}
            </button>
          ),
        )}
      </div>

      <main
        className={`order-layout ${
          kitchenIsClosed
            ? "ordering-disabled"
            : ""
        }`}
      >
        <div className="order-menu-column">
          {availableSpecials.length > 0 && (
            <section
              className="category-section order-specials-section"
              id="order-specials"
            >
              <div className="order-specials-heading">
                <div>
                  <div className="eyebrow">
                    LIMITED TIME
                  </div>

                  <h2>Current specials</h2>
                </div>

                <span>
                  {availableSpecials.length}{" "}
                  {availableSpecials.length === 1
                    ? "special"
                    : "specials"}{" "}
                  available
                </span>
              </div>

              <div className="order-specials-grid">
                {availableSpecials.map(
                  (special) => {
                    const cartId = `special:${special.id}`;
                    const quantity =
                      cart[cartId] || 0;

                    return (
                      <article
                        className="order-special-card"
                        key={special.id}
                      >
                        <div
                          className="order-special-image"
                          style={{
                            backgroundImage: `url("${
                              special.imageUrl ||
                              SPECIAL_FALLBACK_IMAGE
                            }")`,
                          }}
                        >
                          <div className="order-special-image-overlay" />

                          <div className="order-special-labels">
                            {special.day && (
                              <span>
                                {special.day}
                              </span>
                            )}

                            {special.badge && (
                              <span>
                                {special.badge}
                              </span>
                            )}
                          </div>

                          {kitchenIsClosed && (
                            <span className="ordering-closed-image-badge">
                              Ordering closed
                            </span>
                          )}
                        </div>

                        <div className="order-special-content">
                          <div>
                            <h3>{special.title}</h3>

                            {special.description && (
                              <p>
                                {
                                  special.description
                                }
                              </p>
                            )}
                          </div>

                          <div className="order-special-bottom">
                            <strong>
                              {money(
                                Math.round(
                                  (special.price ||
                                    0) * 100,
                                ),
                              )}
                            </strong>

                            {quantity > 0 ? (
                              <div className="order-special-quantity">
                                <button
                                  type="button"
                                  onClick={() =>
                                    change(
                                      cartId,
                                      -1,
                                    )
                                  }
                                  aria-label={`Remove one ${special.title}`}
                                >
                                  −
                                </button>

                                <span>
                                  {quantity}
                                </span>

                                <button
                                  type="button"
                                  disabled={
                                    !kitchenIsOpen
                                  }
                                  onClick={() =>
                                    change(
                                      cartId,
                                      1,
                                    )
                                  }
                                  aria-label={`Add another ${special.title}`}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="round"
                                disabled={
                                  !kitchenIsOpen
                                }
                                onClick={() =>
                                  change(
                                    cartId,
                                    1,
                                  )
                                }
                                aria-label={`Add ${special.title} to cart`}
                              >
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            </section>
          )}

          {activeCategories.map((category) => {
            const categoryItems =
              availableItems.filter(
                (item) =>
                  item.categoryId === category.id,
              );

            if (!categoryItems.length) {
              return null;
            }

            return (
              <section
                className="category-section"
                id={category.id}
                key={category.id}
              >
                <div className="menu-category-heading">
                  <h2>{category.name}</h2>

                  <span>
                    {categoryItems.length}{" "}
                    {categoryItems.length === 1
                      ? "item"
                      : "items"}
                  </span>
                </div>

                <div className="menu-grid menu-grid-visual">
                  {categoryItems.map((item) => {
                    const cartId = `item:${item.id}`;

                    const quantity =
                      cart[cartId] || 0;

                    const dietary = Array.isArray(
                      item.dietary,
                    )
                      ? item.dietary
                      : [];

                    const unavailable =
                      item.soldOut ||
                      !kitchenIsOpen;

                    return (
                      <article
                        className={`menu-card menu-card-visual ${
                          item.soldOut
                            ? "sold"
                            : ""
                        } ${
                          !kitchenIsOpen
                            ? "ordering-closed-card"
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

                          {item.soldOut && (
                            <span className="menu-sold-badge">
                              SOLD OUT
                            </span>
                          )}

                          {!item.soldOut &&
                            kitchenIsClosed && (
                              <span className="ordering-closed-image-badge">
                                Ordering closed
                              </span>
                            )}

                          {dietary.length > 0 && (
                            <div className="menu-card-image-tags">
                              {dietary.map((tag) => (
                                <span key={tag}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="menu-card-body">
                          <div>
                            <h3>{item.name}</h3>

                            <p>
                              {item.description ||
                                "A favourite from the Broken Hill Hotel kitchen."}
                            </p>
                          </div>

                          <div className="menu-bottom">
                            <strong>
                              {money(
                                item.priceCents,
                              )}
                            </strong>

                            {quantity > 0 ? (
                              <div className="menu-card-quantity">
                                <button
                                  type="button"
                                  onClick={() =>
                                    change(
                                      cartId,
                                      -1,
                                    )
                                  }
                                  aria-label={`Remove one ${item.name}`}
                                >
                                  −
                                </button>

                                <span>
                                  {quantity}
                                </span>

                                <button
                                  type="button"
                                  disabled={
                                    unavailable
                                  }
                                  onClick={() =>
                                    change(
                                      cartId,
                                      1,
                                    )
                                  }
                                  aria-label={`Add another ${item.name}`}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="round"
                                disabled={
                                  unavailable
                                }
                                onClick={() =>
                                  change(
                                    cartId,
                                    1,
                                  )
                                }
                                aria-label={`Add ${item.name} to cart`}
                              >
                                {item.soldOut
                                  ? "×"
                                  : "+"}
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="cart">
          <div
            className={`cart-kitchen-status ${
              kitchenIsOpen
                ? "open"
                : "closed"
            }`}
          >
            <span />

            <div>
              <strong>
                {checkingKitchen
                  ? "Checking kitchen"
                  : kitchenIsOpen
                    ? "Kitchen open"
                    : "Kitchen closed"}
              </strong>

              <small>
                {kitchenIsOpen
                  ? "Accepting online orders"
                  : "Checkout is disabled"}
              </small>
            </div>
          </div>

          <div className="cart-head">
            <div>
              <h2>Your order</h2>

              {itemCount > 0 && (
                <span className="cart-count">
                  {itemCount}{" "}
                  {itemCount === 1
                    ? "item"
                    : "items"}
                </span>
              )}
            </div>

            <button
              type="button"
              className="text-button"
              onClick={() => setCart({})}
              disabled={!cartLines.length}
            >
              Clear
            </button>
          </div>

          {!cartLines.length ? (
            <div className="cart-empty">
              Your cart is empty.
              <br />
              Add something delicious.
            </div>
          ) : (
            cartLines.map((line) => (
              <div
                className="cart-line"
                key={line.cartId}
              >
                <div className="cart-line-top">
                  <div>
                    <h4>{line.name}</h4>

                    {line.type ===
                      "SPECIAL" && (
                      <span className="cart-special-label">
                        Special
                      </span>
                    )}
                  </div>

                  <strong>
                    {money(
                      line.priceCents *
                        line.quantity,
                    )}
                  </strong>
                </div>

                <div className="quantity">
                  <button
                    type="button"
                    onClick={() =>
                      change(line.cartId, -1)
                    }
                  >
                    −
                  </button>

                  <span>{line.quantity}</span>

                  <button
                    type="button"
                    disabled={!kitchenIsOpen}
                    onClick={() =>
                      change(line.cartId, 1)
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}

          <div className="totals">
            <div className="total-line">
              <span>Pickup</span>
              <strong>Free</strong>
            </div>

            <div className="total-line grand">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
          </div>

          <div className="cart-payment-note">
            <LockIcon />

            <span>
              Secure online card payment available
            </span>
          </div>

          {kitchenIsClosed && (
            <div className="cart-closed-message">
              <strong>{closedTitle}</strong>
              <p>{closedNote}</p>
            </div>
          )}

          <button
            type="button"
            className="button full"
            disabled={
              checkingKitchen ||
              !cartLines.length ||
              !kitchenIsOpen
            }
            onClick={() => {
              void openCheckout();
            }}
          >
            {checkingKitchen
              ? "Checking kitchen…"
              : !kitchenIsOpen
                ? "Kitchen closed"
                : `Checkout • ${money(total)}`}
          </button>
        </aside>
      </main>

      {checkout && kitchenIsOpen && (
        <div
          className="modal-backdrop checkout-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeCheckout();
            }
          }}
        >
          <div
            className="new-checkout"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-heading"
          >
            <header className="new-checkout-header">
              <div className="new-checkout-brand">
                <span>BH</span>

                <div>
                  <small>
                    BROKEN HILL HOTEL
                  </small>

                  <h2 id="checkout-heading">
                    Pickup checkout
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="new-checkout-close"
                onClick={closeCheckout}
                disabled={submitting}
                aria-label="Close checkout"
              >
                Close <span>×</span>
              </button>
            </header>

            <form onSubmit={submitOrder}>
              <div className="new-checkout-content">
                <div className="new-checkout-main">
                  <section className="checkout-step">
                    <div className="checkout-step-header">
                      <span className="checkout-step-icon">
                        <ContactIcon />
                      </span>

                      <div>
                        <small>STEP 1</small>
                        <h3>Contact details</h3>
                      </div>
                    </div>

                    <div className="checkout-fields">
                      <div className="checkout-input">
                        <label htmlFor="customerName">
                          Name
                        </label>

                        <input
                          id="customerName"
                          name="customerName"
                          autoComplete="name"
                          placeholder="Your full name"
                          disabled={submitting}
                          required
                        />
                      </div>

                      <div className="checkout-input">
                        <label htmlFor="customerPhone">
                          Mobile
                        </label>

                        <input
                          id="customerPhone"
                          name="customerPhone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="04xx xxx xxx"
                          disabled={submitting}
                          required
                        />
                      </div>

                      <div className="checkout-input full">
                        <label htmlFor="customerEmail">
                          Email
                          {paymentMethod === "PICKUP"
                            ? " (optional)"
                            : ""}
                        </label>

                        <input
                          id="customerEmail"
                          name="customerEmail"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder="name@example.com"
                          disabled={submitting}
                          required={
                            paymentMethod ===
                            "ONLINE"
                          }
                        />
                      </div>
                    </div>
                  </section>

                  <section className="checkout-step">
                    <div className="checkout-step-header">
                      <span className="checkout-step-icon">
                        <ClockIcon />
                      </span>

                      <div>
                        <small>STEP 2</small>
                        <h3>Pickup time</h3>
                      </div>
                    </div>

                    <div className="checkout-step-body">
                      <div className="checkout-input">
                        <label htmlFor="pickupTime">
                          Preferred pickup time
                        </label>

                        <input
                          id="pickupTime"
                          name="pickupTime"
                          type="datetime-local"
                          min={firstPickup}
                          defaultValue={firstPickup}
                          disabled={submitting}
                          required
                        />
                      </div>

                      <p className="checkout-help">
                        Typical preparation time is{" "}
                        {settings.pickupMinutes} minutes.
                      </p>
                    </div>
                  </section>

                  <section className="checkout-step">
                    <div className="checkout-step-header">
                      <span className="checkout-step-icon">
                        <CardIcon />
                      </span>

                      <div>
                        <small>STEP 3</small>
                        <h3>Payment method</h3>
                      </div>
                    </div>

                    <div className="checkout-payment-list">
                      <label
                        className={`checkout-payment-option ${
                          paymentMethod ===
                          "ONLINE"
                            ? "selected"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentSelection"
                          value="ONLINE"
                          checked={
                            paymentMethod ===
                            "ONLINE"
                          }
                          onChange={() => {
                            setPaymentMethod(
                              "ONLINE",
                            );

                            setError("");
                          }}
                          disabled={submitting}
                        />

                        <span className="checkout-payment-check" />

                        <span className="checkout-payment-copy">
                          <span className="checkout-payment-title">
                            <strong>
                              Pay online
                            </strong>

                            <span>
                              Recommended
                            </span>
                          </span>

                          <small>
                            Pay securely by card
                            using Stripe.
                          </small>
                        </span>
                      </label>

                      <label
                        className={`checkout-payment-option ${
                          paymentMethod ===
                          "PICKUP"
                            ? "selected"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentSelection"
                          value="PICKUP"
                          checked={
                            paymentMethod ===
                            "PICKUP"
                          }
                          onChange={() => {
                            setPaymentMethod(
                              "PICKUP",
                            );

                            setError("");
                          }}
                          disabled={submitting}
                        />

                        <span className="checkout-payment-check" />

                        <span className="checkout-payment-copy">
                          <span className="checkout-payment-title">
                            <strong>
                              Pay at pickup
                            </strong>
                          </span>

                          <small>
                            Pay at the hotel when
                            collecting your order.
                          </small>
                        </span>
                      </label>
                    </div>

                    {paymentMethod ===
                      "ONLINE" && (
                      <div className="checkout-stripe-note">
                        <LockIcon />

                        <div>
                          <strong>
                            Secure Stripe payment
                          </strong>

                          <p>
                            You will be redirected
                            to Stripe to enter your
                            card details.
                          </p>
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="checkout-step">
                    <div className="checkout-step-header">
                      <span className="checkout-step-icon">
                        <NoteIcon />
                      </span>

                      <div>
                        <small>OPTIONAL</small>
                        <h3>Order comments</h3>
                      </div>
                    </div>

                    <div className="checkout-step-body">
                      <div className="checkout-input">
                        <label htmlFor="notes">
                          Allergies, requests or
                          pickup instructions
                        </label>

                        <textarea
                          id="notes"
                          name="notes"
                          rows={4}
                          placeholder="Add a note for the kitchen"
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </section>
                </div>

                <aside className="checkout-order-summary">
                  <div className="checkout-summary-heading">
                    <div>
                      <small>YOUR ORDER</small>
                      <h3>Pickup summary</h3>
                    </div>

                    <span>
                      {itemCount}{" "}
                      {itemCount === 1
                        ? "item"
                        : "items"}
                    </span>
                  </div>

                  <div className="checkout-summary-lines">
                    {cartLines.map((line) => (
                      <div
                        className="checkout-summary-line"
                        key={line.cartId}
                      >
                        <strong>
                          {line.quantity}×
                        </strong>

                        <div>
                          <span>{line.name}</span>

                          {line.type ===
                            "SPECIAL" && (
                            <small>
                              Special
                            </small>
                          )}
                        </div>

                        <b>
                          {money(
                            line.priceCents *
                              line.quantity,
                          )}
                        </b>
                      </div>
                    ))}
                  </div>

                  <div className="checkout-summary-totals">
                    <div>
                      <span>Subtotal</span>
                      <strong>
                        {money(total)}
                      </strong>
                    </div>

                    <div>
                      <span>Pickup</span>
                      <strong>Free</strong>
                    </div>

                    <div className="checkout-summary-grand">
                      <span>Total</span>
                      <strong>
                        {money(total)}
                      </strong>
                    </div>
                  </div>

                  <div className="checkout-summary-status">
                    <span className="open" />

                    <div>
                      <strong>
                        Kitchen open
                      </strong>

                      <small>
                        Typical pickup:{" "}
                        {
                          settings.pickupMinutes
                        }{" "}
                        minutes
                      </small>
                    </div>
                  </div>

                  <div className="checkout-summary-secure">
                    <LockIcon />
                    Secure payment powered by Stripe
                  </div>
                </aside>
              </div>

              {error && (
                <div
                  className="new-checkout-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <footer className="new-checkout-footer">
                <div>
                  <p>
                    By placing this order, you
                    confirm the order and pickup
                    details are correct.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !kitchenIsOpen
                  }
                >
                  <span>
                    <small>TOTAL</small>
                    <strong>
                      {money(total)}
                    </strong>
                  </span>

                  <b>
                    {submitting
                      ? paymentMethod ===
                        "ONLINE"
                        ? "Opening Stripe…"
                        : "Placing order…"
                      : paymentMethod ===
                          "ONLINE"
                        ? "Continue to secure payment"
                        : "Place pickup order now"}
                  </b>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  );
}