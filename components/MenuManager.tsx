"use client";

import { useMemo, useState } from "react";
import type { Category, MenuItem } from "@/lib/types";

type Special = {
  id: string;
  title: string;
  description: string | null;
  price: number | string | null;
  day: string | null;
  badge: string | null;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
};

type ItemDraft = {
  id?: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  active: boolean;
  soldOut: boolean;
  dietary: string;
  sortOrder: string;
};

type SpecialDraft = {
  id?: string;
  title: string;
  description: string;
  price: string;
  day: string;
  badge: string;
  imageUrl: string;
  active: boolean;
  sortOrder: string;
};

type MenuManagerProps = {
  initialCategories: Category[];
  initialItems: MenuItem[];
  initialSpecials: Special[];
};

type ImagePreviewProps = {
  src?: string | null;
  alt: string;
  title: string;
  subtitle: string;
  className?: string;
  children?: React.ReactNode;
};

const emptyDraft = (categoryId = ""): ItemDraft => ({
  categoryId,
  name: "",
  description: "",
  imageUrl: "",
  price: "",
  active: true,
  soldOut: false,
  dietary: "",
  sortOrder: "0",
});

const emptySpecialDraft = (): SpecialDraft => ({
  title: "",
  description: "",
  price: "",
  day: "",
  badge: "CHEF SPECIAL",
  imageUrl: "",
  active: true,
  sortOrder: "0",
});

function ImagePreview({
  src,
  alt,
  title,
  subtitle,
  className = "",
  children,
}: ImagePreviewProps) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(src?.trim()) && !failed;

  return (
    <div className={`menu-image-frame ${className}`}>
      {hasImage && (
        <img
          key={src}
          src={src ?? ""}
          alt={alt}
          onLoad={() => setFailed(false)}
          onError={() => setFailed(true)}
        />
      )}

      {!hasImage && (
        <div className="menu-image-placeholder">
          <span className="menu-placeholder-mark">BH</span>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </div>
      )}

      {children}
    </div>
  );
}

export default function MenuManager({
  initialCategories,
  initialItems,
  initialSpecials,
}: MenuManagerProps) {
  const [activePanel, setActivePanel] =
    useState<"menu" | "specials">("menu");

  const [categories, setCategories] =
    useState<Category[]>(initialCategories);

  const [items, setItems] =
    useState<MenuItem[]>(initialItems);

  const [specials, setSpecials] =
    useState<Special[]>(
      Array.isArray(initialSpecials)
        ? initialSpecials
        : [],
    );

  const [selectedCategory, setSelectedCategory] =
    useState(initialCategories[0]?.id ?? "");

  const [draft, setDraft] = useState<ItemDraft>(
    emptyDraft(initialCategories[0]?.id ?? ""),
  );

  const [specialDraft, setSpecialDraft] =
    useState<SpecialDraft>(emptySpecialDraft());

  const [categoryName, setCategoryName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const sortedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.name.localeCompare(b.name),
      ),
    [categories],
  );

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...items]
      .filter((item) => {
        const matchesCategory =
          !selectedCategory ||
          item.categoryId === selectedCategory;

        const matchesSearch =
          !query ||
          item.name.toLowerCase().includes(query) ||
          (item.description ?? "")
            .toLowerCase()
            .includes(query);

        return matchesCategory && matchesSearch;
      })
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.name.localeCompare(b.name),
      );
  }, [items, selectedCategory, search]);

  const sortedSpecials = useMemo(
    () =>
      [...specials].sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.title.localeCompare(b.title),
      ),
    [specials],
  );

  const selectedCategoryName =
    categories.find(
      (category) => category.id === selectedCategory,
    )?.name ?? "All items";

  function notify(text: string) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 2200);
  }

  function resetDraft(categoryId = selectedCategory) {
    setDraft(emptyDraft(categoryId));
  }

  function resetSpecialDraft() {
    setSpecialDraft(emptySpecialDraft());
  }

  function editItem(item: MenuItem) {
    setActivePanel("menu");
    setSelectedCategory(item.categoryId);

    setDraft({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description ?? "",
      imageUrl: item.imageUrl ?? "",
      price: (item.priceCents / 100).toFixed(2),
      active: item.active,
      soldOut: item.soldOut,
      dietary: Array.isArray(item.dietary)
        ? item.dietary.join(", ")
        : "",
      sortOrder: String(item.sortOrder),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function editSpecial(special: Special) {
    setActivePanel("specials");

    setSpecialDraft({
      id: special.id,
      title: special.title,
      description: special.description ?? "",
      price:
        special.price === null
          ? ""
          : Number(special.price).toFixed(2),
      day: special.day ?? "",
      badge: special.badge ?? "CHEF SPECIAL",
      imageUrl: special.imageUrl ?? "",
      active: special.active,
      sortOrder: String(special.sortOrder),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveItem(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setBusy(true);

    try {
      const priceCents = Math.round(
        Number(draft.price) * 100,
      );

      if (!draft.categoryId) {
        throw new Error("Choose a category.");
      }

      if (!draft.name.trim()) {
        throw new Error("Enter an item name.");
      }

      if (
        !Number.isFinite(priceCents) ||
        priceCents < 0
      ) {
        throw new Error("Enter a valid price.");
      }

      const payload = {
        categoryId: draft.categoryId,
        name: draft.name.trim(),
        description: draft.description.trim(),
        imageUrl:
          draft.imageUrl.trim() || null,
        priceCents,
        active: draft.active,
        soldOut: draft.soldOut,
        dietary: draft.dietary
          .split(",")
          .map((tag) =>
            tag.trim().toUpperCase(),
          )
          .filter(Boolean),
        sortOrder:
          Number(draft.sortOrder) || 0,
      };

      const response = await fetch(
        draft.id
          ? `/api/admin/menu/${draft.id}`
          : "/api/admin/menu",
        {
          method: draft.id
            ? "PATCH"
            : "POST",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Could not save item.",
        );
      }

      if (draft.id) {
        setItems((current) =>
          current.map((item) =>
            item.id === result.id
              ? result
              : item,
          ),
        );

        notify("Menu item updated");
      } else {
        setItems((current) => [
          ...current,
          result,
        ]);

        notify("Menu item created");
      }

      setSelectedCategory(
        result.categoryId,
      );

      resetDraft(result.categoryId);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Could not save item",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveSpecial(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setBusy(true);

    try {
      const price = Number(
        specialDraft.price,
      );

      if (!specialDraft.title.trim()) {
        throw new Error(
          "Enter a special title.",
        );
      }

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        throw new Error(
          "Enter a valid price.",
        );
      }

      const payload = {
        title:
          specialDraft.title.trim(),
        description:
          specialDraft.description.trim() ||
          null,
        price,
        day:
          specialDraft.day.trim() || null,
        badge:
          specialDraft.badge.trim() ||
          "CHEF SPECIAL",
        imageUrl:
          specialDraft.imageUrl.trim() ||
          null,
        active: specialDraft.active,
        sortOrder:
          Number(
            specialDraft.sortOrder,
          ) || 0,
      };

      const response = await fetch(
        specialDraft.id
          ? `/api/admin/specials/${specialDraft.id}`
          : "/api/admin/specials",
        {
          method: specialDraft.id
            ? "PATCH"
            : "POST",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Could not save chef special.",
        );
      }

      const normalized: Special = {
        ...result,
        price:
          result.price === null
            ? null
            : Number(result.price),
      };

      if (specialDraft.id) {
        setSpecials((current) =>
          current.map((special) =>
            special.id === normalized.id
              ? normalized
              : special,
          ),
        );

        notify("Chef special updated");
      } else {
        setSpecials((current) => [
          ...current,
          normalized,
        ]);

        notify("Chef special created");
      }

      resetSpecialDraft();
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Could not save chef special",
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(
    item: MenuItem,
  ) {
    const confirmed = window.confirm(
      `Delete "${item.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch(
      `/api/admin/menu/${item.id}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      const result =
        await response.json();

      notify(
        result.error ||
          "Could not delete item",
      );

      return;
    }

    setItems((current) =>
      current.filter(
        (entry) => entry.id !== item.id,
      ),
    );

    if (draft.id === item.id) {
      resetDraft();
    }

    notify("Menu item deleted");
  }

  async function deleteSpecial(
    special: Special,
  ) {
    const confirmed = window.confirm(
      `Delete chef special "${special.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch(
      `/api/admin/specials/${special.id}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      const result =
        await response.json();

      notify(
        result.error ||
          "Could not delete chef special",
      );

      return;
    }

    setSpecials((current) =>
      current.filter(
        (entry) =>
          entry.id !== special.id,
      ),
    );

    if (
      specialDraft.id === special.id
    ) {
      resetSpecialDraft();
    }

    notify("Chef special deleted");
  }

  async function quickUpdate(
    item: MenuItem,
    changes: Partial<MenuItem>,
  ) {
    const response = await fetch(
      `/api/admin/menu/${item.id}`,
      {
        method: "PATCH",
        headers: {
          "content-type":
            "application/json",
        },
        body: JSON.stringify(changes),
      },
    );

    if (!response.ok) {
      const result =
        await response.json();

      notify(
        result.error ||
          "Could not update item",
      );

      return;
    }

    const updated = await response.json();

    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? updated
          : entry,
      ),
    );
  }

  async function quickUpdateSpecial(
    special: Special,
    changes: Partial<Special>,
  ) {
    const response = await fetch(
      `/api/admin/specials/${special.id}`,
      {
        method: "PATCH",
        headers: {
          "content-type":
            "application/json",
        },
        body: JSON.stringify(changes),
      },
    );

    if (!response.ok) {
      const result =
        await response.json();

      notify(
        result.error ||
          "Could not update chef special",
      );

      return;
    }

    const updated =
      await response.json();

    setSpecials((current) =>
      current.map((entry) =>
        entry.id === special.id
          ? {
              ...updated,
              price:
                updated.price === null
                  ? null
                  : Number(
                      updated.price,
                    ),
            }
          : entry,
      ),
    );
  }

  async function createCategory(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const name = categoryName.trim();

    if (!name) {
      return;
    }

    const response = await fetch(
      "/api/admin/categories",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/json",
        },
        body: JSON.stringify({ name }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      notify(
        result.error ||
          "Could not create category",
      );

      return;
    }

    setCategories((current) => [
      ...current,
      result,
    ]);

    setCategoryName("");
    setSelectedCategory(result.id);
    resetDraft(result.id);
    notify("Category created");
  }

  async function renameCategory(
    category: Category,
  ) {
    const name = window
      .prompt(
        "Category name",
        category.name,
      )
      ?.trim();

    if (
      !name ||
      name === category.name
    ) {
      return;
    }

    const response = await fetch(
      `/api/admin/categories/${category.id}`,
      {
        method: "PATCH",
        headers: {
          "content-type":
            "application/json",
        },
        body: JSON.stringify({ name }),
      },
    );

    if (!response.ok) {
      const result =
        await response.json();

      notify(
        result.error ||
          "Could not rename category",
      );

      return;
    }

    const updated = await response.json();

    setCategories((current) =>
      current.map((entry) =>
        entry.id === category.id
          ? updated
          : entry,
      ),
    );

    notify("Category renamed");
  }

  async function toggleCategory(
    category: Category,
  ) {
    const response = await fetch(
      `/api/admin/categories/${category.id}`,
      {
        method: "PATCH",
        headers: {
          "content-type":
            "application/json",
        },
        body: JSON.stringify({
          active: !category.active,
        }),
      },
    );

    if (!response.ok) {
      const result =
        await response.json();

      notify(
        result.error ||
          "Could not update category",
      );

      return;
    }

    const updated = await response.json();

    setCategories((current) =>
      current.map((entry) =>
        entry.id === category.id
          ? updated
          : entry,
      ),
    );
  }

  async function deleteCategory(
    category: Category,
  ) {
    const hasItems = items.some(
      (item) =>
        item.categoryId === category.id,
    );

    if (hasItems) {
      notify(
        "Move or delete this category's menu items first",
      );

      return;
    }

    const confirmed = window.confirm(
      `Delete category "${category.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch(
      `/api/admin/categories/${category.id}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      const result =
        await response.json();

      notify(
        result.error ||
          "Could not delete category",
      );

      return;
    }

    const remaining =
      categories.filter(
        (entry) =>
          entry.id !== category.id,
      );

    const nextId =
      remaining[0]?.id ?? "";

    setCategories(remaining);
    setSelectedCategory(nextId);
    resetDraft(nextId);

    notify("Category deleted");
  }

  return (
    <div className="menu-manager menu-manager-redesign">
      {message && (
        <div className="menu-toast">
          {message}
        </div>
      )}

      <div className="menu-manager-switcher">
        <button
          type="button"
          className={
            activePanel === "menu"
              ? "active"
              : ""
          }
          onClick={() =>
            setActivePanel("menu")
          }
        >
          Menu items
          <span>{items.length}</span>
        </button>

        <button
          type="button"
          className={
            activePanel === "specials"
              ? "active"
              : ""
          }
          onClick={() =>
            setActivePanel("specials")
          }
        >
          Chef specials
          <span>{specials.length}</span>
        </button>
      </div>

      {activePanel === "menu" ? (
        <div className="menu-manager-grid">
          <aside className="menu-sidebar">
            <div className="menu-sidebar-head">
              <div>
                <div className="eyebrow">
                  CATEGORIES
                </div>

                <h2>Menu sections</h2>
              </div>

              <span>
                {categories.length}
              </span>
            </div>

            <form
              className="category-create-form"
              onSubmit={createCategory}
            >
              <input
                value={categoryName}
                onChange={(event) =>
                  setCategoryName(
                    event.target.value,
                  )
                }
                placeholder="New category"
              />

              <button
                className="button"
                type="submit"
              >
                Add
              </button>
            </form>

            <div className="category-manager-list category-sidebar-list">
              {sortedCategories.map(
                (category) => {
                  const count = items.filter(
                    (item) =>
                      item.categoryId ===
                      category.id,
                  ).length;

                  return (
                    <div
                      className={`category-manager-row ${
                        selectedCategory ===
                        category.id
                          ? "selected"
                          : ""
                      }`}
                      key={category.id}
                    >
                      <button
                        type="button"
                        className="category-name-button"
                        onClick={() => {
                          setSelectedCategory(
                            category.id,
                          );

                          if (!draft.id) {
                            setDraft(
                              (current) => ({
                                ...current,
                                categoryId:
                                  category.id,
                              }),
                            );
                          }
                        }}
                      >
                        <span>
                          <strong>
                            {category.name}
                          </strong>

                          <small>
                            {count} items
                          </small>
                        </span>

                        <span
                          className={`category-status-dot ${
                            category.active
                              ? "active"
                              : ""
                          }`}
                        />
                      </button>

                      <div className="category-actions">
                        <button
                          type="button"
                          onClick={() =>
                            toggleCategory(
                              category,
                            )
                          }
                        >
                          {category.active
                            ? "Hide"
                            : "Show"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            renameCategory(
                              category,
                            )
                          }
                        >
                          Rename
                        </button>

                        <button
                          type="button"
                          className="danger-text"
                          onClick={() =>
                            deleteCategory(
                              category,
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </aside>

          <div className="menu-manager-main">
            <section className="menu-editor-card menu-editor-redesign">
              <div className="menu-editor-heading">
                <div>
                  <div className="eyebrow">
                    MENU EDITOR
                  </div>

                  <h2>
                    {draft.id
                      ? "Edit menu item"
                      : "Create menu item"}
                  </h2>
                </div>

                {draft.id && (
                  <button
                    className="button light"
                    type="button"
                    onClick={() =>
                      resetDraft()
                    }
                  >
                    Add new instead
                  </button>
                )}
              </div>

              <form
                className="menu-editor-form-redesign"
                onSubmit={saveItem}
              >
                <div className="menu-editor-fields">
                  <div className="menu-form-row">
                    <label>
                      Category
                      <select
                        value={
                          draft.categoryId
                        }
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            categoryId:
                              event.target
                                .value,
                          })
                        }
                        required
                      >
                        <option value="">
                          Choose category
                        </option>

                        {sortedCategories.map(
                          (category) => (
                            <option
                              key={
                                category.id
                              }
                              value={
                                category.id
                              }
                            >
                              {
                                category.name
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label>
                      Item name
                      <input
                        value={draft.name}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            name: event.target
                              .value,
                          })
                        }
                        placeholder="Classic Chicken Parmi"
                        required
                      />
                    </label>
                  </div>

                  <div className="menu-form-row compact">
                    <label>
                      Price (AUD)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.price}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            price:
                              event.target
                                .value,
                          })
                        }
                        placeholder="28.00"
                        required
                      />
                    </label>

                    <label>
                      Display order
                      <input
                        type="number"
                        value={
                          draft.sortOrder
                        }
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            sortOrder:
                              event.target
                                .value,
                          })
                        }
                      />
                    </label>
                  </div>

                  <label>
                    Description
                    <textarea
                      rows={4}
                      value={
                        draft.description
                      }
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          description:
                            event.target.value,
                        })
                      }
                      placeholder="House-crumbed chicken, Napoli, ham, mozzarella, chips and salad."
                    />
                  </label>

                  <label>
                    Image URL
                    <input
                      type="url"
                      value={draft.imageUrl}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          imageUrl:
                            event.target.value,
                        })
                      }
                      placeholder="https://example.com/menu-item.jpg"
                    />

                    <small>
                      Enter a direct JPG,
                      PNG or WebP image URL.
                    </small>
                  </label>

                  <label>
                    Dietary tags
                    <input
                      value={draft.dietary}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          dietary:
                            event.target.value,
                        })
                      }
                      placeholder="GF, V, VG"
                    />
                  </label>

                  <div className="menu-toggle-grid">
                    <label className="menu-toggle-card">
                      <input
                        type="checkbox"
                        checked={draft.active}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            active:
                              event.target
                                .checked,
                          })
                        }
                      />

                      <span>
                        <strong>
                          Visible to customers
                        </strong>

                        <small>
                          Show this item on
                          the ordering page.
                        </small>
                      </span>
                    </label>

                    <label className="menu-toggle-card">
                      <input
                        type="checkbox"
                        checked={
                          draft.soldOut
                        }
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            soldOut:
                              event.target
                                .checked,
                          })
                        }
                      />

                      <span>
                        <strong>
                          Mark as sold out
                        </strong>

                        <small>
                          Keep it visible but
                          prevent ordering.
                        </small>
                      </span>
                    </label>
                  </div>

                  <div className="menu-editor-actions">
                    <button
                      className="button"
                      disabled={busy}
                    >
                      {busy
                        ? "Saving…"
                        : draft.id
                          ? "Save changes"
                          : "Create menu item"}
                    </button>

                    <button
                      className="button light"
                      type="button"
                      onClick={() =>
                        resetDraft()
                      }
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="menu-editor-preview-panel">
                  <div className="menu-preview-label">
                    LIVE PREVIEW
                  </div>

                  <article className="menu-preview-card">
                    <ImagePreview
                      src={draft.imageUrl}
                      alt={
                        draft.name ||
                        "Menu item preview"
                      }
                      title="Menu image"
                      subtitle="Add a valid image URL to preview this item."
                      className="menu-preview-image"
                    >
                      {draft.soldOut && (
                        <span className="status-chip sold-chip menu-preview-status">
                          SOLD OUT
                        </span>
                      )}
                    </ImagePreview>

                    <div className="menu-preview-copy">
                      <div>
                        <h3>
                          {draft.name ||
                            "Menu item name"}
                        </h3>

                        <p>
                          {draft.description ||
                            "Your menu item description will appear here."}
                        </p>
                      </div>

                      <div className="menu-preview-bottom">
                        <strong>
                          {draft.price &&
                          Number.isFinite(
                            Number(
                              draft.price,
                            ),
                          )
                            ? `$${Number(
                                draft.price,
                              ).toFixed(2)}`
                            : "$0.00"}
                        </strong>
                      </div>
                    </div>
                  </article>
                </div>
              </form>
            </section>

            <section className="menu-list-card menu-list-redesign">
              <div className="menu-list-toolbar">
                <div>
                  <div className="eyebrow">
                    CURRENT MENU
                  </div>

                  <h2>
                    {
                      selectedCategoryName
                    }
                  </h2>
                </div>

                <div className="menu-list-tools">
                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search items..."
                  />

                  <span>
                    {visibleItems.length}{" "}
                    items
                  </span>
                </div>
              </div>

              <div className="managed-item-grid">
                {visibleItems.map(
                  (item) => (
                    <article
                      className={`managed-menu-card ${
                        !item.active
                          ? "inactive"
                          : ""
                      }`}
                      key={item.id}
                    >
                      <ImagePreview
                        src={item.imageUrl}
                        alt={item.name}
                        title="No image"
                        subtitle="Edit this item to add a valid image URL."
                        className="managed-menu-image"
                      >
                        <div className="managed-menu-badges">
                          {item.soldOut && (
                            <span className="status-chip sold-chip">
                              SOLD OUT
                            </span>
                          )}

                          {!item.active && (
                            <span className="status-chip hidden-chip">
                              HIDDEN
                            </span>
                          )}
                        </div>
                      </ImagePreview>

                      <div className="managed-menu-content">
                        <div className="managed-menu-title">
                          <h3>
                            {item.name}
                          </h3>

                          <strong>
                            $
                            {(
                              item.priceCents /
                              100
                            ).toFixed(2)}
                          </strong>
                        </div>

                        <p>
                          {item.description ||
                            "No description"}
                        </p>

                        {Array.isArray(
                          item.dietary,
                        ) &&
                          item.dietary
                            .length > 0 && (
                            <div className="tags">
                              {item.dietary.map(
                                (tag) => (
                                  <span
                                    className="tag"
                                    key={tag}
                                  >
                                    {tag}
                                  </span>
                                ),
                              )}
                            </div>
                          )}

                        <div className="managed-item-actions">
                          <button
                            type="button"
                            className="button light"
                            onClick={() =>
                              editItem(item)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="button light"
                            onClick={() =>
                              quickUpdate(
                                item,
                                {
                                  soldOut:
                                    !item.soldOut,
                                },
                              )
                            }
                          >
                            {item.soldOut
                              ? "Back in stock"
                              : "Sold out"}
                          </button>

                          <button
                            type="button"
                            className="button light"
                            onClick={() =>
                              quickUpdate(
                                item,
                                {
                                  active:
                                    !item.active,
                                },
                              )
                            }
                          >
                            {item.active
                              ? "Hide"
                              : "Show"}
                          </button>

                          <button
                            type="button"
                            className="button danger"
                            onClick={() =>
                              deleteItem(item)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ),
                )}

                {!visibleItems.length && (
                  <div className="empty-menu-state">
                    <h3>
                      No menu items found
                    </h3>

                    <p>
                      Create a menu item or
                      change your search.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="special-manager-layout">
          <section className="menu-editor-card menu-editor-redesign">
            <div className="menu-editor-heading">
              <div>
                <div className="eyebrow">
                  CHEF SPECIALS
                </div>

                <h2>
                  {specialDraft.id
                    ? "Edit chef special"
                    : "Create chef special"}
                </h2>
              </div>

              {specialDraft.id && (
                <button
                  type="button"
                  className="button light"
                  onClick={
                    resetSpecialDraft
                  }
                >
                  Add new instead
                </button>
              )}
            </div>

            <form
              className="menu-editor-form-redesign"
              onSubmit={saveSpecial}
            >
              <div className="menu-editor-fields">
                <div className="menu-form-row">
                  <label>
                    Special title
                    <input
                      value={
                        specialDraft.title
                      }
                      onChange={(event) =>
                        setSpecialDraft({
                          ...specialDraft,
                          title:
                            event.target
                              .value,
                        })
                      }
                      placeholder="Fillet Mignon"
                      required
                    />
                  </label>

                  <label>
                    Price (AUD)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        specialDraft.price
                      }
                      onChange={(event) =>
                        setSpecialDraft({
                          ...specialDraft,
                          price:
                            event.target
                              .value,
                        })
                      }
                      placeholder="42.00"
                      required
                    />
                  </label>
                </div>

                <label>
                  Description
                  <textarea
                    rows={4}
                    value={
                      specialDraft.description
                    }
                    onChange={(event) =>
                      setSpecialDraft({
                        ...specialDraft,
                        description:
                          event.target.value,
                      })
                    }
                    placeholder="Premium fillet mignon with potato gratin, seasonal greens and red wine jus."
                  />
                </label>

                <div className="menu-form-row">
                  <label>
                    Day or availability
                    <input
                      value={
                        specialDraft.day
                      }
                      onChange={(event) =>
                        setSpecialDraft({
                          ...specialDraft,
                          day:
                            event.target
                              .value,
                        })
                      }
                      placeholder="Friday"
                    />
                  </label>

                  <label>
                    Badge
                    <input
                      value={
                        specialDraft.badge
                      }
                      onChange={(event) =>
                        setSpecialDraft({
                          ...specialDraft,
                          badge:
                            event.target
                              .value,
                        })
                      }
                      placeholder="CHEF SPECIAL"
                    />
                  </label>
                </div>

                <label>
                  Image URL
                  <input
                    type="url"
                    value={
                      specialDraft.imageUrl
                    }
                    onChange={(event) =>
                      setSpecialDraft({
                        ...specialDraft,
                        imageUrl:
                          event.target.value,
                      })
                    }
                    placeholder="https://example.com/special.jpg"
                  />

                  <small>
                    Enter a direct JPG,
                    PNG or WebP image URL.
                  </small>
                </label>

                <div className="menu-form-row compact">
                  <label>
                    Display order
                    <input
                      type="number"
                      value={
                        specialDraft.sortOrder
                      }
                      onChange={(event) =>
                        setSpecialDraft({
                          ...specialDraft,
                          sortOrder:
                            event.target
                              .value,
                        })
                      }
                    />
                  </label>

                  <label className="menu-toggle-card">
                    <input
                      type="checkbox"
                      checked={
                        specialDraft.active
                      }
                      onChange={(event) =>
                        setSpecialDraft({
                          ...specialDraft,
                          active:
                            event.target
                              .checked,
                        })
                      }
                    />

                    <span>
                      <strong>
                        Active special
                      </strong>

                      <small>
                        Show on the homepage
                        and ordering page.
                      </small>
                    </span>
                  </label>
                </div>

                <div className="menu-editor-actions">
                  <button
                    className="button"
                    disabled={busy}
                  >
                    {busy
                      ? "Saving…"
                      : specialDraft.id
                        ? "Save special"
                        : "Create chef special"}
                  </button>

                  <button
                    type="button"
                    className="button light"
                    onClick={
                      resetSpecialDraft
                    }
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="menu-editor-preview-panel">
                <div className="menu-preview-label">
                  LIVE PREVIEW
                </div>

                <article className="menu-preview-card special-preview-card">
                  <ImagePreview
                    src={
                      specialDraft.imageUrl
                    }
                    alt={
                      specialDraft.title ||
                      "Chef special preview"
                    }
                    title="Special image"
                    subtitle="Add a valid image URL to preview this special."
                    className="menu-preview-image"
                  >
                    <span className="special-preview-badge">
                      {specialDraft.badge ||
                        "CHEF SPECIAL"}
                    </span>
                  </ImagePreview>

                  <div className="menu-preview-copy">
                    <div>
                      <small>
                        {specialDraft.day ||
                          "AVAILABLE NOW"}
                      </small>

                      <h3>
                        {specialDraft.title ||
                          "Chef special"}
                      </h3>

                      <p>
                        {specialDraft.description ||
                          "Your chef special description will appear here."}
                      </p>
                    </div>

                    <div className="menu-preview-bottom">
                      <strong>
                        {specialDraft.price &&
                        Number.isFinite(
                          Number(
                            specialDraft.price,
                          ),
                        )
                          ? `$${Number(
                              specialDraft.price,
                            ).toFixed(2)}`
                          : "$0.00"}
                      </strong>
                    </div>
                  </div>
                </article>
              </div>
            </form>
          </section>

          <section className="menu-list-card menu-list-redesign">
            <div className="menu-list-toolbar">
              <div>
                <div className="eyebrow">
                  CURRENT SPECIALS
                </div>

                <h2>
                  Chef specials
                </h2>
              </div>

              <span>
                {sortedSpecials.length}{" "}
                specials
              </span>
            </div>

            <div className="managed-item-grid">
              {sortedSpecials.map(
                (special) => (
                  <article
                    className={`managed-menu-card ${
                      !special.active
                        ? "inactive"
                        : ""
                    }`}
                    key={special.id}
                  >
                    <ImagePreview
                      src={
                        special.imageUrl
                      }
                      alt={special.title}
                      title="No special image"
                      subtitle="Edit this special to add a valid image URL."
                      className="managed-menu-image"
                    >
                      <div className="managed-menu-badges">
                        <span className="status-chip">
                          {special.badge ||
                            "CHEF SPECIAL"}
                        </span>

                        {!special.active && (
                          <span className="status-chip hidden-chip">
                            HIDDEN
                          </span>
                        )}
                      </div>
                    </ImagePreview>

                    <div className="managed-menu-content">
                      <div className="managed-menu-title">
                        <h3>
                          {special.title}
                        </h3>

                        <strong>
                          {special.price ===
                          null
                            ? "—"
                            : `$${Number(
                                special.price,
                              ).toFixed(2)}`}
                        </strong>
                      </div>

                      <p>
                        {special.description ||
                          "No description"}
                      </p>

                      <div className="managed-item-meta">
                        {special.day && (
                          <span>
                            {special.day}
                          </span>
                        )}

                        <span>
                          Order:{" "}
                          {
                            special.sortOrder
                          }
                        </span>
                      </div>

                      <div className="managed-item-actions">
                        <button
                          type="button"
                          className="button light"
                          onClick={() =>
                            editSpecial(
                              special,
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="button light"
                          onClick={() =>
                            quickUpdateSpecial(
                              special,
                              {
                                active:
                                  !special.active,
                              },
                            )
                          }
                        >
                          {special.active
                            ? "Hide"
                            : "Show"}
                        </button>

                        <button
                          type="button"
                          className="button danger"
                          onClick={() =>
                            deleteSpecial(
                              special,
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ),
              )}

              {!sortedSpecials.length && (
                <div className="empty-menu-state">
                  <h3>
                    No chef specials yet
                  </h3>

                  <p>
                    Create your first chef
                    special above.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}