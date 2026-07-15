"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
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
  children?: ReactNode;
};

type ApiError = {
  error?: string;
  details?: unknown;
};

const emptyItemDraft = (categoryId = ""): ItemDraft => ({
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

async function readApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}.`);
    }

    return {} as T;
  }

  let data: T | ApiError;

  try {
    data = JSON.parse(text) as T | ApiError;
  } catch {
    console.error("Non-JSON API response:", text);

    throw new Error(
      `The server returned HTML instead of JSON (${response.status}). Check that the API route exists and is in the correct folder.`,
    );
  }

  if (!response.ok) {
    const apiError = data as ApiError;

    throw new Error(
      apiError.error || `Request failed with status ${response.status}.`,
    );
  }

  return data as T;
}

function normalizeSpecial(special: Special): Special {
  return {
    ...special,
    description: special.description ?? null,
    day: special.day ?? null,
    badge: special.badge ?? null,
    imageUrl: special.imageUrl ?? null,
    price:
      special.price === null || special.price === ""
        ? null
        : Number(special.price),
    active: Boolean(special.active),
    sortOrder: Number(special.sortOrder) || 0,
  };
}

function ImagePreview({
  src,
  alt,
  title,
  subtitle,
  className = "",
  children,
}: ImagePreviewProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const cleanSource = src?.trim() ?? "";
  const showImage = cleanSource.length > 0 && !failed;

  return (
    <div className={`menu-image-frame ${className}`}>
      {showImage ? (
        <img
          src={cleanSource}
          alt={alt}
          onError={() => setFailed(true)}
        />
      ) : (
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

  const [categories, setCategories] = useState<Category[]>(
    Array.isArray(initialCategories) ? initialCategories : [],
  );

  const [items, setItems] = useState<MenuItem[]>(
    Array.isArray(initialItems) ? initialItems : [],
  );

  const [specials, setSpecials] = useState<Special[]>(
    Array.isArray(initialSpecials)
      ? initialSpecials.map(normalizeSpecial)
      : [],
  );

  const [selectedCategory, setSelectedCategory] = useState(
    initialCategories?.[0]?.id ?? "",
  );

  const [itemDraft, setItemDraft] = useState<ItemDraft>(
    emptyItemDraft(initialCategories?.[0]?.id ?? ""),
  );

  const [specialDraft, setSpecialDraft] =
    useState<SpecialDraft>(emptySpecialDraft());

  const [categoryName, setCategoryName] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
        const categoryMatches =
          !selectedCategory || item.categoryId === selectedCategory;

        const searchMatches =
          !query ||
          item.name.toLowerCase().includes(query) ||
          (item.description ?? "").toLowerCase().includes(query);

        return categoryMatches && searchMatches;
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
    categories.find((category) => category.id === selectedCategory)
      ?.name ?? "All items";

  function notify(text: string) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 2600);
  }

  function resetItemDraft(categoryId = selectedCategory) {
    setItemDraft(emptyItemDraft(categoryId));
  }

  function resetSpecialDraft() {
    setSpecialDraft(emptySpecialDraft());
  }

  function editItem(item: MenuItem) {
    setActivePanel("menu");
    setSelectedCategory(item.categoryId);

    setItemDraft({
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

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) {
      return;
    }

    setBusy(true);

    try {
      const priceCents = Math.round(Number(itemDraft.price) * 100);
      const sortOrder = Number(itemDraft.sortOrder);

      if (!itemDraft.categoryId) {
        throw new Error("Choose a category.");
      }

      if (itemDraft.name.trim().length < 2) {
        throw new Error("Enter a valid menu item name.");
      }

      if (!Number.isFinite(priceCents) || priceCents < 0) {
        throw new Error("Enter a valid price.");
      }

      if (
        itemDraft.sortOrder.trim() &&
        !Number.isInteger(sortOrder)
      ) {
        throw new Error("Display order must be a whole number.");
      }

      const payload = {
        categoryId: itemDraft.categoryId,
        name: itemDraft.name.trim(),
        description: itemDraft.description.trim(),
        imageUrl: itemDraft.imageUrl.trim() || null,
        priceCents,
        active: itemDraft.active,
        soldOut: itemDraft.soldOut,
        dietary: itemDraft.dietary
          .split(",")
          .map((tag) => tag.trim().toUpperCase())
          .filter(Boolean),
        sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0,
      };

      const isEditing = Boolean(itemDraft.id);

      const endpoint = isEditing
        ? `/api/admin/menu/${encodeURIComponent(itemDraft.id!)}`
        : "/api/admin/menu";

      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const savedItem = await readApiResponse<MenuItem>(response);

      if (isEditing) {
        setItems((current) =>
          current.map((item) =>
            item.id === savedItem.id ? savedItem : item,
          ),
        );

        notify("Menu item updated");
      } else {
        setItems((current) => [...current, savedItem]);
        notify("Menu item created");
      }

      setSelectedCategory(savedItem.categoryId);
      resetItemDraft(savedItem.categoryId);
    } catch (error) {
      console.error("Save menu item error:", error);

      notify(
        error instanceof Error
          ? error.message
          : "Could not save menu item.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveSpecial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) {
      return;
    }

    setBusy(true);

    try {
      const title = specialDraft.title.trim();
      const price = Number(specialDraft.price);
      const sortOrder = Number(specialDraft.sortOrder);

      if (title.length < 2) {
        throw new Error("Enter a valid special title.");
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new Error("Enter a valid price.");
      }

      if (
        specialDraft.sortOrder.trim() &&
        !Number.isInteger(sortOrder)
      ) {
        throw new Error("Display order must be a whole number.");
      }

      const payload = {
        title,
        description: specialDraft.description.trim() || null,
        price,
        day: specialDraft.day.trim() || null,
        badge: specialDraft.badge.trim() || "CHEF SPECIAL",
        imageUrl: specialDraft.imageUrl.trim() || null,
        active: specialDraft.active,
        sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0,
      };

      const isEditing = Boolean(specialDraft.id);

      const endpoint = isEditing
        ? `/api/admin/specials/${encodeURIComponent(
            specialDraft.id!,
          )}`
        : "/api/admin/specials";

      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await readApiResponse<Special>(response);
      const savedSpecial = normalizeSpecial(result);

      if (isEditing) {
        setSpecials((current) =>
          current.map((special) =>
            special.id === savedSpecial.id ? savedSpecial : special,
          ),
        );

        notify("Chef special updated");
      } else {
        setSpecials((current) => [...current, savedSpecial]);
        notify("Chef special created");
      }

      resetSpecialDraft();
    } catch (error) {
      console.error("Save chef special error:", error);

      notify(
        error instanceof Error
          ? error.message
          : "Could not save chef special.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function quickUpdateItem(
    item: MenuItem,
    changes: Partial<MenuItem>,
  ) {
    try {
      const response = await fetch(
        `/api/admin/menu/${encodeURIComponent(item.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(changes),
        },
      );

      const updated = await readApiResponse<MenuItem>(response);

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? updated : entry,
        ),
      );
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Could not update menu item.",
      );
    }
  }

  async function quickUpdateSpecial(
    special: Special,
    changes: Partial<Special>,
  ) {
    try {
      const response = await fetch(
        `/api/admin/specials/${encodeURIComponent(special.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(changes),
        },
      );

      const result = await readApiResponse<Special>(response);
      const updated = normalizeSpecial(result);

      setSpecials((current) =>
        current.map((entry) =>
          entry.id === special.id ? updated : entry,
        ),
      );
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Could not update chef special.",
      );
    }
  }

  async function deleteItem(item: MenuItem) {
    if (!window.confirm(`Delete "${item.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/menu/${encodeURIComponent(item.id)}`,
        {
          method: "DELETE",
        },
      );

      await readApiResponse<{ success: boolean }>(response);

      setItems((current) =>
        current.filter((entry) => entry.id !== item.id),
      );

      if (itemDraft.id === item.id) {
        resetItemDraft();
      }

      notify("Menu item deleted");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Could not delete menu item.",
      );
    }
  }

  async function deleteSpecial(special: Special) {
    if (!window.confirm(`Delete chef special "${special.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/specials/${encodeURIComponent(special.id)}`,
        {
          method: "DELETE",
        },
      );

      await readApiResponse<{ success: boolean }>(response);

      setSpecials((current) =>
        current.filter((entry) => entry.id !== special.id),
      );

      if (specialDraft.id === special.id) {
        resetSpecialDraft();
      }

      notify("Chef special deleted");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Could not delete chef special.",
      );
    }
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = categoryName.trim();

    if (!name) {
      return;
    }

    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const category = await readApiResponse<Category>(response);

      setCategories((current) => [...current, category]);
      setCategoryName("");
      setSelectedCategory(category.id);
      resetItemDraft(category.id);
      notify("Category created");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Could not create category.",
      );
    }
  }

  async function renameCategory(category: Category) {
    const name = window
      .prompt("Category name", category.name)
      ?.trim();

    if (!name || name === category.name) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/categories/${encodeURIComponent(category.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        },
      );

      const updated = await readApiResponse<Category>(response);

      setCategories((current) =>
        current.map((entry) =>
          entry.id === category.id ? updated : entry,
        ),
      );

      notify("Category renamed");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Could not rename category.",
      );
    }
  }

  async function toggleCategory(category: Category) {
    try {
      const response = await fetch(
        `/api/admin/categories/${encodeURIComponent(category.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            active: !category.active,
          }),
        },
      );

      const updated = await readApiResponse<Category>(response);

      setCategories((current) =>
        current.map((entry) =>
          entry.id === category.id ? updated : entry,
        ),
      );
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Could not update category.",
      );
    }
  }

  async function deleteCategory(category: Category) {
    const hasItems = items.some(
      (item) => item.categoryId === category.id,
    );

    if (hasItems) {
      notify("Move or delete this category's menu items first.");
      return;
    }

    if (!window.confirm(`Delete category "${category.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/categories/${encodeURIComponent(category.id)}`,
        {
          method: "DELETE",
        },
      );

      await readApiResponse<{ success: boolean }>(response);

      const remaining = categories.filter(
        (entry) => entry.id !== category.id,
      );

      const nextCategoryId = remaining[0]?.id ?? "";

      setCategories(remaining);
      setSelectedCategory(nextCategoryId);
      resetItemDraft(nextCategoryId);
      notify("Category deleted");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Could not delete category.",
      );
    }
  }

  return (
    <div className="menu-manager menu-manager-redesign">
      {message && <div className="menu-toast">{message}</div>}

      <div className="menu-manager-switcher">
        <button
          type="button"
          className={activePanel === "menu" ? "active" : ""}
          onClick={() => setActivePanel("menu")}
        >
          Menu items
          <span>{items.length}</span>
        </button>

        <button
          type="button"
          className={activePanel === "specials" ? "active" : ""}
          onClick={() => setActivePanel("specials")}
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
                <div className="eyebrow">CATEGORIES</div>
                <h2>Menu sections</h2>
              </div>

              <span>{categories.length}</span>
            </div>

            <form
              className="category-create-form"
              onSubmit={createCategory}
            >
              <input
                value={categoryName}
                onChange={(event) =>
                  setCategoryName(event.target.value)
                }
                placeholder="New category"
              />

              <button className="button" type="submit">
                Add
              </button>
            </form>

            <div className="category-manager-list category-sidebar-list">
              {sortedCategories.map((category) => {
                const count = items.filter(
                  (item) => item.categoryId === category.id,
                ).length;

                return (
                  <div
                    className={`category-manager-row ${
                      selectedCategory === category.id
                        ? "selected"
                        : ""
                    }`}
                    key={category.id}
                  >
                    <button
                      type="button"
                      className="category-name-button"
                      onClick={() => {
                        setSelectedCategory(category.id);

                        if (!itemDraft.id) {
                          setItemDraft((current) => ({
                            ...current,
                            categoryId: category.id,
                          }));
                        }
                      }}
                    >
                      <span>
                        <strong>{category.name}</strong>
                        <small>{count} items</small>
                      </span>

                      <span
                        className={`category-status-dot ${
                          category.active ? "active" : ""
                        }`}
                      />
                    </button>

                    <div className="category-actions">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                      >
                        {category.active ? "Hide" : "Show"}
                      </button>

                      <button
                        type="button"
                        onClick={() => renameCategory(category)}
                      >
                        Rename
                      </button>

                      <button
                        type="button"
                        className="danger-text"
                        onClick={() => deleteCategory(category)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <div className="menu-manager-main">
            <section className="menu-editor-card menu-editor-redesign">
              <div className="menu-editor-heading">
                <div>
                  <div className="eyebrow">MENU EDITOR</div>

                  <h2>
                    {itemDraft.id
                      ? "Edit menu item"
                      : "Create menu item"}
                  </h2>
                </div>

                {itemDraft.id && (
                  <button
                    type="button"
                    className="button light"
                    onClick={() => resetItemDraft()}
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
                        value={itemDraft.categoryId}
                        onChange={(event) =>
                          setItemDraft((current) => ({
                            ...current,
                            categoryId: event.target.value,
                          }))
                        }
                        required
                      >
                        <option value="">Choose category</option>

                        {sortedCategories.map((category) => (
                          <option
                            key={category.id}
                            value={category.id}
                          >
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Item name
                      <input
                        value={itemDraft.name}
                        onChange={(event) =>
                          setItemDraft((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Classic Chicken Parmi"
                        maxLength={100}
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
                        value={itemDraft.price}
                        onChange={(event) =>
                          setItemDraft((current) => ({
                            ...current,
                            price: event.target.value,
                          }))
                        }
                        placeholder="28.00"
                        required
                      />
                    </label>

                    <label>
                      Display order
                      <input
                        type="number"
                        step="1"
                        value={itemDraft.sortOrder}
                        onChange={(event) =>
                          setItemDraft((current) => ({
                            ...current,
                            sortOrder: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <label>
                    Description
                    <textarea
                      rows={4}
                      maxLength={500}
                      value={itemDraft.description}
                      onChange={(event) =>
                        setItemDraft((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="House-crumbed chicken, Napoli, ham, mozzarella, chips and salad."
                    />

                    <small>
                      {itemDraft.description.length}/500 characters
                    </small>
                  </label>

                  <label>
                    Image URL
                    <input
                      type="url"
                      value={itemDraft.imageUrl}
                      onChange={(event) =>
                        setItemDraft((current) => ({
                          ...current,
                          imageUrl: event.target.value,
                        }))
                      }
                      placeholder="https://example.com/menu-item.jpg"
                    />

                    <small>
                      Enter a complete direct JPG, PNG or WebP URL.
                    </small>
                  </label>

                  <label>
                    Dietary tags
                    <input
                      value={itemDraft.dietary}
                      onChange={(event) =>
                        setItemDraft((current) => ({
                          ...current,
                          dietary: event.target.value,
                        }))
                      }
                      placeholder="GF, V, VG"
                    />

                    <small>Separate tags with commas.</small>
                  </label>

                  <div className="menu-toggle-grid">
                    <label className="menu-toggle-card">
                      <input
                        type="checkbox"
                        checked={itemDraft.active}
                        onChange={(event) =>
                          setItemDraft((current) => ({
                            ...current,
                            active: event.target.checked,
                          }))
                        }
                      />

                      <span>
                        <strong>Visible to customers</strong>
                        <small>
                          Show this item on the ordering page.
                        </small>
                      </span>
                    </label>

                    <label className="menu-toggle-card">
                      <input
                        type="checkbox"
                        checked={itemDraft.soldOut}
                        onChange={(event) =>
                          setItemDraft((current) => ({
                            ...current,
                            soldOut: event.target.checked,
                          }))
                        }
                      />

                      <span>
                        <strong>Mark as sold out</strong>
                        <small>
                          Keep it visible but prevent ordering.
                        </small>
                      </span>
                    </label>
                  </div>

                  <div className="menu-editor-actions">
                    <button
                      type="submit"
                      className="button"
                      disabled={busy}
                    >
                      {busy
                        ? "Saving…"
                        : itemDraft.id
                          ? "Save changes"
                          : "Create menu item"}
                    </button>

                    <button
                      type="button"
                      className="button light"
                      onClick={() => resetItemDraft()}
                      disabled={busy}
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
                      src={itemDraft.imageUrl}
                      alt={itemDraft.name || "Menu item preview"}
                      title="Menu image"
                      subtitle="Add a valid image URL to preview this item."
                      className="menu-preview-image"
                    >
                      {itemDraft.soldOut && (
                        <span className="status-chip sold-chip menu-preview-status">
                          SOLD OUT
                        </span>
                      )}
                    </ImagePreview>

                    <div className="menu-preview-copy">
                      <div>
                        <h3>
                          {itemDraft.name || "Menu item name"}
                        </h3>

                        <p>
                          {itemDraft.description ||
                            "Your menu item description will appear here."}
                        </p>
                      </div>

                      <div className="menu-preview-bottom">
                        <strong>
                          {itemDraft.price &&
                          Number.isFinite(Number(itemDraft.price))
                            ? `$${Number(itemDraft.price).toFixed(2)}`
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
                  <div className="eyebrow">CURRENT MENU</div>
                  <h2>{selectedCategoryName}</h2>
                </div>

                <div className="menu-list-tools">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search items..."
                  />

                  <span>{visibleItems.length} items</span>
                </div>
              </div>

              <div className="managed-item-grid">
                {visibleItems.map((item) => (
                  <article
                    className={`managed-menu-card ${
                      !item.active ? "inactive" : ""
                    }`}
                    key={item.id}
                  >
                    <ImagePreview
                      src={item.imageUrl}
                      alt={item.name}
                      title="No image"
                      subtitle="Edit this menu item to add an image."
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
                        <h3>{item.name}</h3>

                        <strong>
                          ${(item.priceCents / 100).toFixed(2)}
                        </strong>
                      </div>

                      <p>{item.description || "No description"}</p>

                      {Array.isArray(item.dietary) &&
                        item.dietary.length > 0 && (
                          <div className="tags">
                            {item.dietary.map((tag) => (
                              <span className="tag" key={tag}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                      <div className="managed-item-actions">
                        <button
                          type="button"
                          className="button light"
                          onClick={() => editItem(item)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="button light"
                          onClick={() =>
                            quickUpdateItem(item, {
                              soldOut: !item.soldOut,
                            })
                          }
                        >
                          {item.soldOut ? "Back in stock" : "Sold out"}
                        </button>

                        <button
                          type="button"
                          className="button light"
                          onClick={() =>
                            quickUpdateItem(item, {
                              active: !item.active,
                            })
                          }
                        >
                          {item.active ? "Hide" : "Show"}
                        </button>

                        <button
                          type="button"
                          className="button danger"
                          onClick={() => deleteItem(item)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}

                {!visibleItems.length && (
                  <div className="empty-menu-state">
                    <h3>No menu items found</h3>
                    <p>
                      Create an item or change your search filter.
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
                <div className="eyebrow">CHEF SPECIALS</div>

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
                  onClick={resetSpecialDraft}
                  disabled={busy}
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
                      value={specialDraft.title}
                      onChange={(event) =>
                        setSpecialDraft((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Eye Fillet"
                      maxLength={120}
                      required
                    />
                  </label>

                  <label>
                    Price (AUD)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={specialDraft.price}
                      onChange={(event) =>
                        setSpecialDraft((current) => ({
                          ...current,
                          price: event.target.value,
                        }))
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
                    maxLength={500}
                    value={specialDraft.description}
                    onChange={(event) =>
                      setSpecialDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Premium grilled eye fillet served with two golden potato croquettes on Kewpie mayo, seasonal mixed vegetables and rich gravy on the side."
                  />

                  <small>
                    {specialDraft.description.length}/500 characters
                  </small>
                </label>

                <div className="menu-form-row">
                  <label>
                    Day or availability
                    <input
                      value={specialDraft.day}
                      onChange={(event) =>
                        setSpecialDraft((current) => ({
                          ...current,
                          day: event.target.value,
                        }))
                      }
                      placeholder="Chef Special"
                      maxLength={60}
                    />
                  </label>

                  <label>
                    Badge
                    <input
                      value={specialDraft.badge}
                      onChange={(event) =>
                        setSpecialDraft((current) => ({
                          ...current,
                          badge: event.target.value,
                        }))
                      }
                      placeholder="LIMITED TIME"
                      maxLength={60}
                    />
                  </label>
                </div>

                <label>
                  Image URL
                  <input
                    type="url"
                    value={specialDraft.imageUrl}
                    onChange={(event) =>
                      setSpecialDraft((current) => ({
                        ...current,
                        imageUrl: event.target.value,
                      }))
                    }
                    placeholder="https://example.com/special.jpg"
                  />

                  <small>
                    Enter a complete direct JPG, PNG or WebP URL.
                  </small>
                </label>

                <div className="menu-form-row compact">
                  <label>
                    Display order
                    <input
                      type="number"
                      step="1"
                      value={specialDraft.sortOrder}
                      onChange={(event) =>
                        setSpecialDraft((current) => ({
                          ...current,
                          sortOrder: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="menu-toggle-card">
                    <input
                      type="checkbox"
                      checked={specialDraft.active}
                      onChange={(event) =>
                        setSpecialDraft((current) => ({
                          ...current,
                          active: event.target.checked,
                        }))
                      }
                    />

                    <span>
                      <strong>Active special</strong>
                      <small>
                        Show this special on the homepage and ordering
                        page.
                      </small>
                    </span>
                  </label>
                </div>

                <div className="menu-editor-actions">
                  <button
                    type="submit"
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
                    onClick={resetSpecialDraft}
                    disabled={busy}
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
                    src={specialDraft.imageUrl}
                    alt={
                      specialDraft.title || "Chef special preview"
                    }
                    title="Special image"
                    subtitle="Add a valid image URL to preview this special."
                    className="menu-preview-image"
                  >
                    <span className="special-preview-badge">
                      {specialDraft.badge || "CHEF SPECIAL"}
                    </span>
                  </ImagePreview>

                  <div className="menu-preview-copy">
                    <div>
                      <small>
                        {specialDraft.day || "AVAILABLE NOW"}
                      </small>

                      <h3>
                        {specialDraft.title || "Chef special"}
                      </h3>

                      <p>
                        {specialDraft.description ||
                          "Your chef special description will appear here."}
                      </p>
                    </div>

                    <div className="menu-preview-bottom">
                      <strong>
                        {specialDraft.price &&
                        Number.isFinite(Number(specialDraft.price))
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
                <div className="eyebrow">CURRENT SPECIALS</div>
                <h2>Chef specials</h2>
              </div>

              <span>{sortedSpecials.length} specials</span>
            </div>

            <div className="managed-item-grid">
              {sortedSpecials.map((special) => (
                <article
                  className={`managed-menu-card ${
                    !special.active ? "inactive" : ""
                  }`}
                  key={special.id}
                >
                  <ImagePreview
                    src={special.imageUrl}
                    alt={special.title}
                    title="No special image"
                    subtitle="Edit this special to add an image."
                    className="managed-menu-image"
                  >
                    <div className="managed-menu-badges">
                      <span className="status-chip">
                        {special.badge || "CHEF SPECIAL"}
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
                      <h3>{special.title}</h3>

                      <strong>
                        {special.price === null
                          ? "—"
                          : `$${Number(special.price).toFixed(2)}`}
                      </strong>
                    </div>

                    <p>{special.description || "No description"}</p>

                    <div className="managed-item-meta">
                      {special.day && <span>{special.day}</span>}
                      <span>Order: {special.sortOrder}</span>
                    </div>

                    <div className="managed-item-actions">
                      <button
                        type="button"
                        className="button light"
                        onClick={() => editSpecial(special)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="button light"
                        onClick={() =>
                          quickUpdateSpecial(special, {
                            active: !special.active,
                          })
                        }
                      >
                        {special.active ? "Hide" : "Show"}
                      </button>

                      <button
                        type="button"
                        className="button danger"
                        onClick={() => deleteSpecial(special)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {!sortedSpecials.length && (
                <div className="empty-menu-state">
                  <h3>No chef specials yet</h3>
                  <p>Create your first chef special above.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}