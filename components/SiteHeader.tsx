"use client";

import { useState } from "react";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      {/* Logo */}
      <a href="/" className="brand" onClick={closeMenu}>
        <span className="mark">BH</span>

        <span>
          BROKEN HILL
          <small>HOTEL • EST. 1899</small>
        </span>
      </a>

      {/* Desktop Navigation */}
      <nav className="site-nav">
        <a href="#eat">Eat</a>
        <a href="#stay">Stay</a>
        <a href="#whats-on">What's On</a>
        <a href="#visit">Visit</a>

        <a className="button light" href="/admin">
          Staff
        </a>

        <a className="button" href="/order">
          Order online
        </a>
      </nav>

      {/* Mobile Burger Button */}
      <button
        type="button"
        className="mobile-menu-button"
        onClick={toggleMenu}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? (
          <span className="close-icon">✕</span>
        ) : (
          <span className="burger-icon">🍔</span>
        )}
      </button>

      {/* Mobile Menu */}
      <nav className={`mobile-nav ${menuOpen ? "open" : ""}`}>
        <a href="#eat" onClick={closeMenu}>
          Eat
        </a>

        <a href="#stay" onClick={closeMenu}>
          Stay
        </a>

        <a href="#whats-on" onClick={closeMenu}>
          What's On
        </a>

        <a href="#visit" onClick={closeMenu}>
          Visit
        </a>

        <a href="/admin" onClick={closeMenu}>
          Staff
        </a>

        <a
          href="/order"
          className="button mobile-order-button"
          onClick={closeMenu}
        >
          Order Online
        </a>
      </nav>
    </header>
  );
}