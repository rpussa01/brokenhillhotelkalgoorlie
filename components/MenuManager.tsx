"use client";

import { useMemo, useState } from "react";
import type { Category, MenuItem } from "@/lib/types";

type ItemDraft = {
  id?: string;
  categoryId: string;
  name: string;
  description: string;
  price: string;
  active: boolean;
  soldOut: boolean;
  dietary: string;
  sortOrder: string;
};

const emptyDraft = (categoryId = ""): ItemDraft => ({
  categoryId,
  name: "",
  description: "",
  price: "",
  active: true,
  soldOut: false,
  dietary: "",
  sortOrder: "0"
});

export default function MenuManager({
  initialCategories,
  initialItems
}: {
  initialCategories: Category[];
  initialItems: MenuItem[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState(initialItems);
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategories[0]?.id || ""
  );
  const [draft, setDraft] = useState<ItemDraft>(
    emptyDraft(initialCategories[0]?.id || "")
  );
  const [categoryName, setCategoryName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const visibleItems = useMemo(
    () =>
      items
        .filter(item => !selectedCategory || item.categoryId === selectedCategory)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [items, selectedCategory]
  );

  function notify(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2200);
  }

  function editItem(item: MenuItem) {
    setDraft({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      price: (item.priceCents / 100).toFixed(2),
      active: item.active,
      soldOut: item.soldOut,
      dietary: Array.isArray(item.dietary) ? item.dietary.join(", ") : "",
      sortOrder: String(item.sortOrder)
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetDraft(categoryId = selectedCategory) {
    setDraft(emptyDraft(categoryId));
  }

  async function saveItem(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        categoryId: draft.categoryId,
        name: draft.name.trim(),
        description: draft.description.trim(),
        priceCents: Math.round(Number(draft.price) * 100),
        active: draft.active,
        soldOut: draft.soldOut,
        dietary: draft.dietary
          .split(",")
          .map(tag => tag.trim().toUpperCase())
          .filter(Boolean),
        sortOrder: Number(draft.sortOrder) || 0
      };

      const url = draft.id ? `/api/admin/menu/${draft.id}` : "/api/admin/menu";
      const method = draft.id ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save item.");

      if (draft.id) {
        setItems(current => current.map(item => item.id === result.id ? result : item));
        notify("Menu item updated");
      } else {
        setItems(current => [...current, result]);
        notify("Menu item created");
      }
      setSelectedCategory(result.categoryId);
      resetDraft(result.categoryId);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save item");
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(item: MenuItem) {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    const response = await fetch(`/api/admin/menu/${item.id}`, { method: "DELETE" });
    if (response.ok) {
      setItems(current => current.filter(x => x.id !== item.id));
      if (draft.id === item.id) resetDraft();
      notify("Menu item deleted");
    } else {
      const result = await response.json();
      notify(result.error || "Could not delete item");
    }
  }

  async function quickUpdate(item: MenuItem, changes: Partial<MenuItem>) {
    const response = await fetch(`/api/admin/menu/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(changes)
    });
    if (response.ok) {
      const updated = await response.json();
      setItems(current => current.map(x => x.id === item.id ? updated : x));
    }
  }

  async function createCategory(event: React.FormEvent) {
    event.preventDefault();
    if (!categoryName.trim()) return;
    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: categoryName.trim() })
    });
    const result = await response.json();
    if (!response.ok) return notify(result.error || "Could not create category");
    setCategories(current => [...current, result]);
    setCategoryName("");
    setSelectedCategory(result.id);
    resetDraft(result.id);
    notify("Category created");
  }

  async function renameCategory(category: Category) {
    const name = window.prompt("Category name", category.name)?.trim();
    if (!name || name === category.name) return;
    const response = await fetch(`/api/admin/categories/${category.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name })
    });
    if (response.ok) {
      const updated = await response.json();
      setCategories(current => current.map(x => x.id === category.id ? updated : x));
      notify("Category renamed");
    }
  }

  async function toggleCategory(category: Category) {
    const response = await fetch(`/api/admin/categories/${category.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !category.active })
    });
    if (response.ok) {
      const updated = await response.json();
      setCategories(current => current.map(x => x.id === category.id ? updated : x));
    }
  }

  async function deleteCategory(category: Category) {
    if (items.some(item => item.categoryId === category.id)) {
      return notify("Move or delete this category's menu items first");
    }
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    const response = await fetch(`/api/admin/categories/${category.id}`, {
      method: "DELETE"
    });
    if (response.ok) {
      const remaining = categories.filter(x => x.id !== category.id);
      setCategories(remaining);
      const nextId = remaining[0]?.id || "";
      setSelectedCategory(nextId);
      resetDraft(nextId);
      notify("Category deleted");
    }
  }

  return (
    <div className="menu-manager">
      {message && <div className="menu-toast">{message}</div>}

      <section className="menu-editor-card">
        <div className="menu-editor-heading">
          <div>
            <div className="eyebrow">MENU EDITOR</div>
            <h2>{draft.id ? "Edit menu item" : "Add menu item"}</h2>
          </div>
          {draft.id && (
            <button className="button light" type="button" onClick={() => resetDraft()}>
              Add new instead
            </button>
          )}
        </div>

        <form className="menu-editor-form" onSubmit={saveItem}>
          <label>
            Category
            <select
              value={draft.categoryId}
              onChange={e => setDraft({ ...draft, categoryId: e.target.value })}
              required
            >
              <option value="">Choose category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <label>
            Item name
            <input
              value={draft.name}
              onChange={e => setDraft({ ...draft, name: e.target.value })}
              placeholder="Classic Chicken Parmi"
              required
            />
          </label>

          <label>
            Price (AUD)
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              onChange={e => setDraft({ ...draft, price: e.target.value })}
              placeholder="28.00"
              required
            />
          </label>

          <label>
            Display order
            <input
              type="number"
              value={draft.sortOrder}
              onChange={e => setDraft({ ...draft, sortOrder: e.target.value })}
            />
          </label>

          <label className="wide-field">
            Description
            <textarea
              rows={3}
              value={draft.description}
              onChange={e => setDraft({ ...draft, description: e.target.value })}
              placeholder="House-crumbed chicken, Napoli, ham, mozzarella, chips and salad."
            />
          </label>

          <label className="wide-field">
            Dietary tags
            <input
              value={draft.dietary}
              onChange={e => setDraft({ ...draft, dietary: e.target.value })}
              placeholder="GF, V, VG"
            />
            <small>Separate multiple tags with commas.</small>
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={e => setDraft({ ...draft, active: e.target.checked })}
            />
            Visible to customers
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={draft.soldOut}
              onChange={e => setDraft({ ...draft, soldOut: e.target.checked })}
            />
            Mark as sold out
          </label>

          <div className="menu-editor-actions wide-field">
            <button className="button" disabled={busy}>
              {busy ? "Saving…" : draft.id ? "Save changes" : "Add menu item"}
            </button>
            <button className="button light" type="button" onClick={() => resetDraft()}>
              Reset
            </button>
          </div>
        </form>
      </section>

      <section className="category-manager-card">
        <div className="menu-editor-heading">
          <div>
            <div className="eyebrow">CATEGORIES</div>
            <h2>Menu sections</h2>
          </div>
          <form className="category-create-form" onSubmit={createCategory}>
            <input
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
              placeholder="New category"
            />
            <button className="button">Add category</button>
          </form>
        </div>

        <div className="category-manager-list">
          {categories
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(category => (
              <div
                className={`category-manager-row ${selectedCategory === category.id ? "selected" : ""}`}
                key={category.id}
              >
                <button className="category-name-button" onClick={() => {
                  setSelectedCategory(category.id);
                  if (!draft.id) setDraft(current => ({ ...current, categoryId: category.id }));
                }}>
                  <strong>{category.name}</strong>
                  <small>{items.filter(item => item.categoryId === category.id).length} items</small>
                </button>
                <div className="category-actions">
                  <button onClick={() => toggleCategory(category)}>
                    {category.active ? "Visible" : "Hidden"}
                  </button>
                  <button onClick={() => renameCategory(category)}>Rename</button>
                  <button className="danger-text" onClick={() => deleteCategory(category)}>Delete</button>
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="menu-list-card">
        <div className="menu-list-heading">
          <div>
            <div className="eyebrow">CURRENT MENU</div>
            <h2>
              {categories.find(c => c.id === selectedCategory)?.name || "All items"}
            </h2>
          </div>
          <span>{visibleItems.length} items</span>
        </div>

        <div className="managed-item-list">
          {visibleItems.map(item => (
            <article className={`managed-item ${!item.active ? "inactive" : ""}`} key={item.id}>
              <div className="managed-item-main">
                <div className="managed-item-title">
                  <h3>{item.name}</h3>
                  {item.soldOut && <span className="status-chip sold-chip">SOLD OUT</span>}
                  {!item.active && <span className="status-chip hidden-chip">HIDDEN</span>}
                </div>
                <p>{item.description || "No description"}</p>
                <div className="managed-item-meta">
                  <strong>${(item.priceCents / 100).toFixed(2)}</strong>
                  <span>Order: {item.sortOrder}</span>
                  {(Array.isArray(item.dietary) ? item.dietary : []).map(tag => (
                    <span className="tag" key={tag}>{tag}</span>
                  ))}
                </div>
              </div>

              <div className="managed-item-actions">
                <button className="button light" onClick={() => editItem(item)}>Edit</button>
                <button
                  className="button light"
                  onClick={() => quickUpdate(item, { soldOut: !item.soldOut })}
                >
                  {item.soldOut ? "Back in stock" : "Sold out"}
                </button>
                <button
                  className="button light"
                  onClick={() => quickUpdate(item, { active: !item.active })}
                >
                  {item.active ? "Hide" : "Show"}
                </button>
                <button className="button danger" onClick={() => deleteItem(item)}>Delete</button>
              </div>
            </article>
          ))}

          {!visibleItems.length && (
            <div className="empty-menu-state">
              No menu items in this category yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
