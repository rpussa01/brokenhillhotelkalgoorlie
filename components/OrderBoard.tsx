"use client";
import { useEffect, useMemo, useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";

const columns: { status: OrderStatus; title: string }[] = [
  { status: "RECEIVED", title: "New orders" },
  { status: "ACCEPTED", title: "Accepted" },
  { status: "COOKING", title: "Cooking" },
  { status: "READY", title: "Ready" }
];

const next: Partial<Record<OrderStatus, OrderStatus>> = {
  RECEIVED: "ACCEPTED", ACCEPTED: "COOKING", COOKING: "READY", READY: "COLLECTED"
};

export default function OrderBoard({ initial }: { initial: Order[] }) {
  const [orders, setOrders] = useState(initial);

  async function refresh() {
    const res = await fetch("/api/admin/orders", { cache: "no-store" });
    if (res.ok) setOrders(await res.json());
  }
  useEffect(() => { const timer = setInterval(refresh, 8000); return () => clearInterval(timer); }, []);

  async function update(id: string, status: OrderStatus) {
    const res = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) refresh();
  }

  const active = orders.filter(o => !["PENDING_PAYMENT", "COLLECTED", "CANCELLED"].includes(o.status));
  const sales = orders.filter(o => o.paymentStatus === "PAID" || o.paymentStatus === "PAY_AT_PICKUP").reduce((s, o) => s + o.totalCents, 0);
  return <>
    <div className="stat-grid"><div className="stat">Active orders<strong>{active.length}</strong></div><div className="stat">New<strong>{orders.filter(o => o.status === "RECEIVED").length}</strong></div><div className="stat">Ready<strong>{orders.filter(o => o.status === "READY").length}</strong></div><div className="stat">Order value<strong>${(sales / 100).toFixed(2)}</strong></div></div>
    <div className="board">{columns.map(column => <section className="column" key={column.status}>
      <div className="column-head"><h2>{column.title.toUpperCase()}</h2><span className="badge">{orders.filter(o => o.status === column.status).length}</span></div>
      {orders.filter(o => o.status === column.status).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).map(order => <article className="order-card" key={order.id}>
        <h3>#{order.orderNumber}</h3><div className="order-meta"><span>{order.customerName}</span><span>{new Date(order.pickupTime).toLocaleTimeString("en-AU",{hour:"numeric",minute:"2-digit"})}</span></div>
        <ul className="order-lines">{order.lines.map((line,i)=><li key={i}><strong>{line.quantity}×</strong> {line.name}</li>)}</ul>
        {order.notes && <p className="order-note">{order.notes}</p>}
        <div className="order-meta"><span>{order.paymentStatus.replaceAll("_"," ")}</span><strong>${(order.totalCents/100).toFixed(2)}</strong></div>
        <div className="order-actions">{next[order.status] && <button className={order.status==="COOKING"?"ready-action":"primary-action"} onClick={()=>update(order.id,next[order.status]!)}>{order.status==="RECEIVED"?"Accept":order.status==="ACCEPTED"?"Start cooking":order.status==="COOKING"?"Mark ready":"Collected"}</button>}<button className="secondary-action" onClick={()=>update(order.id,"CANCELLED")}>Cancel</button></div>
      </article>)}
    </section>)}</div>
  </>;
}
