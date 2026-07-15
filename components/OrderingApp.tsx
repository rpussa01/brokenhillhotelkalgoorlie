"use client";

import { useMemo, useState } from "react";
import type { Category, MenuItem, Settings } from "@/lib/types";

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

const MENU_FALLBACK_IMAGE = "/images/menu-placeholder.jpg";
const SPECIAL_FALLBACK_IMAGE = "/images/special-placeholder.jpg";

const money = (cents: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);

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
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "PICKUP">(
    "PICKUP",
  );

  const activeCategories = useMemo(
    () =>
      categories
        .filter((category) => category.active)
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
        ),
    [categories],
  );

  const availableItems = useMemo(
    () =>
      items
        .filter((item) => item.active)
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
        ),
    [items],
  );

  const availableSpecials = useMemo(
    () => specials.filter((special) => special.price !== null),
    [specials],
  );

  const cartLines = useMemo<CartLine[]>(() => {
    return Object.entries(cart)
      .map(([cartId, quantity]) => {
        if (cartId.startsWith("item:")) {
          const itemId = cartId.replace("item:", "");
          const item = availableItems.find(
            (availableItem) => availableItem.id === itemId,
          );

          if (!item) return null;

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
          const specialId = cartId.replace("special:", "");
          const special = availableSpecials.find(
            (availableSpecial) => availableSpecial.id === specialId,
          );

          if (!special || special.price === null) return null;

          return {
            cartId,
            type: "SPECIAL" as const,
            id: special.id,
            name: special.title,
            priceCents: Math.round(special.price * 100),
            quantity,
          };
        }

        return null;
      })
      .filter((line): line is CartLine => line !== null);
  }, [cart, availableItems, availableSpecials]);

  const total = cartLines.reduce(
    (sum, line) => sum + line.priceCents * line.quantity,
    0,
  );

  function change(cartId: string, delta: number) {
    setCart((current) => {
      const next = {
        ...current,
        [cartId]: (current[cartId] || 0) + delta,
      };

      if (next[cartId] <= 0) {
        delete next[cartId];
      }

      return next;
    });
  }

  function addMenuItem(itemId: string) {
    change(`item:${itemId}`, 1);
  }

  function addSpecial(specialId: string) {
    change(`special:${specialId}`, 1);
  }

  async function submitOrder(formData: FormData) {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          customerName: formData.get("customerName"),
          customerPhone: formData.get("customerPhone"),
          customerEmail: formData.get("customerEmail"),
          pickupTime: formData.get("pickupTime"),
          notes: formData.get("notes"),
          paymentMethod,
          lines: cartLines.map((line) => ({
            itemId: line.type === "MENU_ITEM" ? line.id : undefined,
            specialId: line.type === "SPECIAL" ? line.id : undefined,
            quantity: line.quantity,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not place order.");
      }

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      window.location.href = `/order-success?id=${result.orderId}`;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not place order.",
      );
      setSubmitting(false);
    }
  }

  const firstPickup = useMemo(() => {
    const date = new Date(
      Date.now() + settings.pickupMinutes * 60_000,
    );

    date.setMinutes(Math.ceil(date.getMinutes() / 5) * 5, 0, 0);

    return date.toISOString().slice(0, 16);
  }, [settings.pickupMinutes]);

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
          <a href="/admin">Staff login</a>
          <a className="button" href="tel:+61890930306">
            Call hotel
          </a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">ORDER DIRECT • PICKUP</div>
            <h1>Dinner sorted.</h1>
            <p>
              Order pub favourites directly from the Broken Hill Hotel and
              collect from South Boulder.
            </p>
          </div>

          <div className="open-card">
            <span className="dot" />
            <strong>
              {settings.isOrderingOpen
                ? "Ordering is open"
                : "Ordering is closed"}
            </strong>
            <p>Typical pickup: {settings.pickupMinutes} minutes</p>
          </div>
        </div>
      </section>

      <div className="category-tabs">
        {availableSpecials.length > 0 && (
          <button
            type="button"
            className="active"
            onClick={() =>
              document
                .getElementById("order-specials")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Specials
          </button>
        )}

        {activeCategories.map((category, index) => (
          <button
            type="button"
            className={
              availableSpecials.length === 0 && index === 0
                ? "active"
                : ""
            }
            key={category.id}
            onClick={() =>
              document
                .getElementById(category.id)
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            {category.name}
          </button>
        ))}
      </div>

      <main className="order-layout">
        <div className="order-menu-column">
          {availableSpecials.length > 0 && (
            <section
              className="category-section order-specials-section"
              id="order-specials"
            >
              <div className="order-specials-heading">
                <div>
                  <div className="eyebrow">LIMITED TIME</div>
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
                {availableSpecials.map((special) => {
                  const specialCartId = `special:${special.id}`;
                  const quantity = cart[specialCartId] || 0;

                  return (
                    <article
                      className="order-special-card"
                      key={special.id}
                    >
                      <div
                        className="order-special-image"
                        style={{
                          backgroundImage: `url("${
                            special.imageUrl || SPECIAL_FALLBACK_IMAGE
                          }")`,
                        }}
                      >
                        <div className="order-special-image-overlay" />

                        <div className="order-special-labels">
                          {special.day && <span>{special.day}</span>}
                          {special.badge && <span>{special.badge}</span>}
                        </div>
                      </div>

                      <div className="order-special-content">
                        <div>
                          <h3>{special.title}</h3>
                          {special.description && (
                            <p>{special.description}</p>
                          )}
                        </div>

                        <div className="order-special-bottom">
                          <strong>
                            {money(
                              Math.round((special.price ?? 0) * 100),
                            )}
                          </strong>

                          {quantity > 0 ? (
                            <div className="order-special-quantity">
                              <button
                                type="button"
                                onClick={() =>
                                  change(specialCartId, -1)
                                }
                                aria-label={`Remove one ${special.title}`}
                              >
                                −
                              </button>
                              <span>{quantity}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  change(specialCartId, 1)
                                }
                                disabled={!settings.isOrderingOpen}
                                aria-label={`Add another ${special.title}`}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="round"
                              disabled={!settings.isOrderingOpen}
                              onClick={() => addSpecial(special.id)}
                              aria-label={`Add ${special.title} to cart`}
                            >
                              +
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {activeCategories.map((category) => {
            const categoryItems = availableItems.filter(
              (item) => item.categoryId === category.id,
            );

            if (categoryItems.length === 0) return null;

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
                    {categoryItems.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <div className="menu-grid menu-grid-visual">
                  {categoryItems.map((item) => {
                    const itemCartId = `item:${item.id}`;
                    const quantity = cart[itemCartId] || 0;

                    return (
                      <article
                        className={`menu-card menu-card-visual ${
                          item.soldOut ? "sold" : ""
                        }`}
                        key={item.id}
                      >
                        <div
                          className="menu-card-image"
                          style={{
                            backgroundImage: `url("${
                              item.imageUrl || MENU_FALLBACK_IMAGE
                            }")`,
                          }}
                        >
                          <div className="menu-card-image-shade" />

                          {item.soldOut && (
                            <span className="menu-sold-badge">
                              SOLD OUT
                            </span>
                          )}

                          {(Array.isArray(item.dietary)
                            ? item.dietary
                            : []
                          ).length > 0 && (
                            <div className="menu-card-image-tags">
                              {(Array.isArray(item.dietary)
                                ? item.dietary
                                : []
                              ).map((tag) => (
                                <span key={tag}>{tag}</span>
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
                            <strong>{money(item.priceCents)}</strong>

                            {quantity > 0 ? (
                              <div className="menu-card-quantity">
                                <button
                                  type="button"
                                  onClick={() =>
                                    change(itemCartId, -1)
                                  }
                                  aria-label={`Remove one ${item.name}`}
                                >
                                  −
                                </button>
                                <span>{quantity}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    change(itemCartId, 1)
                                  }
                                  disabled={
                                    item.soldOut ||
                                    !settings.isOrderingOpen
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
                                  item.soldOut ||
                                  !settings.isOrderingOpen
                                }
                                onClick={() => addMenuItem(item.id)}
                                aria-label={`Add ${item.name} to cart`}
                              >
                                {item.soldOut ? "×" : "+"}
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
          <div className="cart-head">
            <h2>Your order</h2>
            <button
              type="button"
              className="text-button"
              onClick={() => setCart({})}
              disabled={cartLines.length === 0}
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
              <div className="cart-line" key={line.cartId}>
                <div className="cart-line-top">
                  <div>
                    <h4>{line.name}</h4>
                    {line.type === "SPECIAL" && (
                      <span className="cart-special-label">
                        Special
                      </span>
                    )}
                  </div>
                  <strong>
                    {money(line.priceCents * line.quantity)}
                  </strong>
                </div>

                <div className="quantity">
                  <button
                    type="button"
                    onClick={() => change(line.cartId, -1)}
                    aria-label={`Remove one ${line.name}`}
                  >
                    −
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => change(line.cartId, 1)}
                    aria-label={`Add another ${line.name}`}
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

          <button
            type="button"
            className="button full"
            disabled={!cartLines.length || !settings.isOrderingOpen}
            onClick={() => setCheckout(true)}
          >
            Checkout
          </button>
        </aside>
      </main>

      {checkout && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCheckout(false);
            }
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-heading"
          >
            <div className="modal-head">
              <h2 id="checkout-heading">Pickup details</h2>
              <button
                type="button"
                className="close"
                onClick={() => setCheckout(false)}
                aria-label="Close checkout"
              >
                ×
              </button>
            </div>

            <form action={submitOrder}>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="customerName">Name</label>
                  <input
                    id="customerName"
                    name="customerName"
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="customerPhone">Mobile</label>
                  <input
                    id="customerPhone"
                    name="customerPhone"
                    type="tel"
                    autoComplete="tel"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="customerEmail">
                    Email (optional)
                  </label>
                  <input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    autoComplete="email"
                  />
                </div>

                <div className="field">
                  <label htmlFor="pickupTime">Pickup time</label>
                  <input
                    id="pickupTime"
                    name="pickupTime"
                    type="datetime-local"
                    min={firstPickup}
                    defaultValue={firstPickup}
                    required
                  />
                </div>

                <div className="field full-row">
                  <label htmlFor="notes">Order notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    placeholder="Allergies, requests or pickup instructions"
                  />
                </div>

                <div className="field full-row">
                  <label>Payment</label>

                  <div className="payment-options">
                    <button
                      type="button"
                      className={`payment-option ${
                        paymentMethod === "PICKUP"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => setPaymentMethod("PICKUP")}
                    >
                      <strong>Pay at pickup</strong>
                      <p>Pay at the hotel when collecting.</p>
                    </button>

                    <button
                      type="button"
                      className={`payment-option ${
                        paymentMethod === "ONLINE"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => setPaymentMethod("ONLINE")}
                    >
                      <strong>Pay online</strong>
                      <p>Secure Stripe checkout.</p>
                    </button>
                  </div>
                </div>
              </div>

              {error && <div className="error">{error}</div>}

              <button className="button full" disabled={submitting}>
                {submitting
                  ? "Placing order…"
                  : `Place order • ${money(total)}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
