"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pin }) });
    if (res.ok) { router.push("/admin/orders"); router.refresh(); }
    else setError("Incorrect staff PIN.");
  }

  return <main className="login-page"><form className="login-card" onSubmit={login}>
    <div className="brand"><span className="mark">BH</span><span>BROKEN HILL<small>STAFF SYSTEM</small></span></div>
    <h1>Staff login</h1><p>Enter the venue admin PIN.</p><input type="password" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value)} autoFocus />
    {error && <div className="error">{error}</div>}<button className="button full">Log in</button>
  </form></main>;
}
