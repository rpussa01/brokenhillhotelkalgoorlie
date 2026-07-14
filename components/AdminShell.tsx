"use client";
export default function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="admin-page">
    <header className="admin-header"><div className="brand"><span className="mark">BH</span><span>BROKIE OPS</span></div>
      <nav className="admin-nav"><a href="/admin/orders">Orders</a><a href="/admin/kitchen">Kitchen</a><a href="/admin/menu">Menu</a><a href="/">Customer site</a></nav>
      <form action="/api/admin/logout" method="post"><button className="button light">Logout</button></form>
    </header>
    <main className="admin-content"><div className="dashboard-head"><h1>{title}</h1><button className="button" onClick={() => location.reload()}>Refresh</button></div>{children}</main>
  </div>;
}
