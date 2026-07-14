"use client";

import { useMemo, useState } from "react";
import type { Category, MenuItem, Settings } from "@/lib/types";

type Cart = Record<string, number>;

const money = (cents: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);

export default function OrderingApp({
  categories,
  items,
  settings
}: {
  categories: Category[];
  items: MenuItem[];
  settings: Settings;
}) {
  const [cart, setCart] = useState<Cart>({});
  const [checkout, setCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "PICKUP">("PICKUP");

  const activeCategories = categories.filter(c => c.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const availableItems = items.filter(i => i.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const cartLines = Object.entries(cart)
    .map(([id, quantity]) => ({ item: availableItems.find(i => i.id === id), quantity }))
    .filter(x => x.item) as { item: MenuItem; quantity: number }[];
  const total = cartLines.reduce((sum, x) => sum + x.item.priceCents * x.quantity, 0);

  function change(id: string, delta: number) {
    setCart(current => {
      const next = { ...current, [id]: (current[id] || 0) + delta };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  }

  async function submitOrder(formData: FormData) {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: formData.get("customerName"),
          customerPhone: formData.get("customerPhone"),
          customerEmail: formData.get("customerEmail"),
          pickupTime: formData.get("pickupTime"),
          notes: formData.get("notes"),
          paymentMethod,
          lines: cartLines.map(x => ({ itemId: x.item.id, quantity: x.quantity }))
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not place order.");
      if (result.checkoutUrl) window.location.href = result.checkoutUrl;
      else window.location.href = `/order-success?id=${result.orderId}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place order.");
      setSubmitting(false);
    }
  }

  const firstPickup = useMemo(() => {
    const d = new Date(Date.now() + settings.pickupMinutes * 60_000);
    d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
    return d.toISOString().slice(0, 16);
  }, [settings.pickupMinutes]);

  return (
    <>
      <header className="topbar">
        <a className="brand" href="/">
          <span className="mark">BH</span>
          <span>BROKEN HILL<small>HOTEL • EST. 1899</small></span>
        </a>
        <nav className="nav"><a href="/admin">Staff login</a><a className="button" href="tel:+61890930306">Call hotel</a></nav>
      </header>

      <section className="hero">
        <div className="hero-grid">
          <div><div className="eyebrow">ORDER DIRECT • PICKUP</div><h1>Dinner sorted.</h1><p>Order pub favourites directly from the Broken Hill Hotel and collect from South Boulder.</p></div>
          <div className="open-card"><span className="dot" /> <strong>{settings.isOrderingOpen ? "Ordering is open" : "Ordering is closed"}</strong><p>Typical pickup: {settings.pickupMinutes} minutes</p></div>
        </div>
      </section>

      <div className="category-tabs">
        {activeCategories.map((c, i) => <button className={i === 0 ? "active" : ""} key={c.id} onClick={() => document.getElementById(c.id)?.scrollIntoView({ behavior: "smooth" })}>{c.name}</button>)}
      </div>

      <main className="order-layout">
        <div>
          {activeCategories.map(category => (
            <section className="category-section" id={category.id} key={category.id}>
              <h2>{category.name}</h2>
              <div className="menu-grid">
                {availableItems.filter(item => item.categoryId === category.id).map(item => (
                  <article className={`menu-card ${item.soldOut ? "sold" : ""}`} key={item.id}>
                    <div><h3>{item.name}</h3><p>{item.description}</p><div className="tags">{(Array.isArray(item.dietary) ? item.dietary : []).map(t => <span className="tag" key={t}>{t}</span>)}</div></div>
                    <div className="menu-bottom"><strong>{money(item.priceCents)}</strong><button className="round" disabled={item.soldOut || !settings.isOrderingOpen} onClick={() => change(item.id, 1)}>{item.soldOut ? "×" : "+"}</button></div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="cart">
          <div className="cart-head"><h2>Your order</h2><button className="text-button" onClick={() => setCart({})}>Clear</button></div>
          {!cartLines.length ? <div className="cart-empty">Your cart is empty.<br />Add something delicious.</div> :
            cartLines.map(({ item, quantity }) => <div className="cart-line" key={item.id}>
              <div className="cart-line-top"><h4>{item.name}</h4><strong>{money(item.priceCents * quantity)}</strong></div>
              <div className="quantity"><button onClick={() => change(item.id, -1)}>−</button><span>{quantity}</span><button onClick={() => change(item.id, 1)}>+</button></div>
            </div>)}
          <div className="totals"><div className="total-line"><span>Pickup</span><strong>Free</strong></div><div className="total-line grand"><span>Total</span><span>{money(total)}</span></div></div>
          <button className="button full" disabled={!cartLines.length || !settings.isOrderingOpen} onClick={() => setCheckout(true)}>Checkout</button>
        </aside>
      </main>

      {checkout && <div className="modal-backdrop">
        <div className="modal">
          <div className="modal-head"><h2>Pickup details</h2><button className="close" onClick={() => setCheckout(false)}>×</button></div>
          <form action={submitOrder}>
            <div className="form-grid">
              <div className="field"><label>Name</label><input name="customerName" required /></div>
              <div className="field"><label>Mobile</label><input name="customerPhone" required /></div>
              <div className="field"><label>Email (optional)</label><input name="customerEmail" type="email" /></div>
              <div className="field"><label>Pickup time</label><input name="pickupTime" type="datetime-local" min={firstPickup} defaultValue={firstPickup} required /></div>
              <div className="field full-row"><label>Order notes</label><textarea name="notes" rows={3} placeholder="Allergies, requests or pickup instructions" /></div>
              <div className="field full-row"><label>Payment</label>
                <div className="payment-options">
                  <div className={`payment-option ${paymentMethod === "PICKUP" ? "selected" : ""}`} onClick={() => setPaymentMethod("PICKUP")}><strong>Pay at pickup</strong><p>Pay at the hotel when collecting.</p></div>
                  <div className={`payment-option ${paymentMethod === "ONLINE" ? "selected" : ""}`} onClick={() => setPaymentMethod("ONLINE")}><strong>Pay online</strong><p>Secure Stripe checkout.</p></div>
                </div>
              </div>
            </div>
            {error && <div className="error">{error}</div>}
            <button className="button full" disabled={submitting}>{submitting ? "Placing order…" : `Place order • ${money(total)}`}</button>
          </form>
        </div>
      </div>}
    </>
  );
}
