"use client";
import { useEffect, useState } from "react";
import type { Order } from "@/lib/types";

export default function KitchenDisplay({ initial }: { initial: Order[] }) {
  const [orders, setOrders] = useState(initial);
  async function refresh(){const r=await fetch("/api/admin/orders",{cache:"no-store"});if(r.ok)setOrders(await r.json())}
  useEffect(()=>{const t=setInterval(refresh,5000);return()=>clearInterval(t)},[]);
  const visible=orders.filter(o=>["ACCEPTED","COOKING","READY"].includes(o.status)).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  return <main className="kds"><div className="kds-head"><div><div className="eyebrow">BROKEN HILL HOTEL</div><h1>KITCHEN DISPLAY</h1></div><a className="button" href="/admin/orders">Order board</a></div>
    <div className="kds-grid">{visible.map(o=><article className={`kds-card ${o.status==="READY"?"ready":""}`} key={o.id}><h2>#{o.orderNumber}</h2><div className="kds-time">{new Date(o.pickupTime).toLocaleTimeString("en-AU",{hour:"numeric",minute:"2-digit"})}</div><p>{o.customerName} • {o.status}</p><ul>{o.lines.map((l,i)=><li key={i}><strong>{l.quantity}×</strong> {l.name}</li>)}</ul>{o.notes&&<p className="order-note">{o.notes}</p>}</article>)}</div>
  </main>
}
