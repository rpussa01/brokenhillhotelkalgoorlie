"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Order, OrderStatus } from "@/lib/types";

type BoardView = "LIVE" | "HISTORY";

type PaymentFilter =
  | "ALL"
  | "PAID"
  | "PENDING"
  | "PAY_AT_PICKUP"
  | "FAILED"
  | "REFUNDED";

type HistoryStatusFilter =
  | "ALL"
  | "COLLECTED"
  | "CANCELLED"
  | "PAYMENT_FAILED";

type SortMode =
  | "OLDEST"
  | "NEWEST"
  | "PICKUP_ASC"
  | "PICKUP_DESC";

type EditableOrder = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupTime: string;
  notes: string;
};

type KitchenStatus = {
  isOpen: boolean;
  closedTitle: string;
  closedNote: string;
};

type OrderColumn = {
  status: OrderStatus;
  title: string;
  description: string;
};

type ApiResult = {
  error?: string;
  readyEmailTriggered?: boolean;
};

const liveColumns: OrderColumn[] = [
  {
    status: "PENDING_PAYMENT",
    title: "Awaiting payment",
    description: "Waiting for Stripe confirmation",
  },
  {
    status: "RECEIVED",
    title: "New orders",
    description: "Ready for kitchen acceptance",
  },
  {
    status: "ACCEPTED",
    title: "Accepted",
    description: "Confirmed and queued",
  },
  {
    status: "COOKING",
    title: "Cooking",
    description: "Currently being prepared",
  },
  {
    status: "READY",
    title: "Ready",
    description: "Waiting for collection",
  },
];

const historyStatuses: OrderStatus[] = [
  "COLLECTED",
  "CANCELLED",
  "PAYMENT_FAILED",
];

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  RECEIVED: "ACCEPTED",
  ACCEPTED: "COOKING",
  COOKING: "READY",
  READY: "COLLECTED",
};

function getActionLabel(status: OrderStatus): string | null {
  switch (status) {
    case "RECEIVED":
      return "Accept order";

    case "ACCEPTED":
      return "Start cooking";

    case "COOKING":
      return "Mark ready & email";

    case "READY":
      return "Mark collected";

    default:
      return null;
  }
}

function getPaymentLabel(
  paymentStatus: Order["paymentStatus"],
): string {
  switch (paymentStatus) {
    case "PAID":
      return "Paid online";

    case "PAY_AT_PICKUP":
      return "Pay at pickup";

    case "PENDING":
      return "Awaiting payment";

    case "FAILED":
      return "Payment failed";

    case "REFUNDED":
      return "Refunded";
  }

  const exhaustiveCheck: never = paymentStatus;
  return exhaustiveCheck;
}

function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Awaiting payment";

    case "PAYMENT_FAILED":
      return "Payment failed";

    case "RECEIVED":
      return "New order";

    case "ACCEPTED":
      return "Accepted";

    case "COOKING":
      return "Cooking";

    case "READY":
      return "Ready";

    case "COLLECTED":
      return "Collected";

    case "CANCELLED":
      return "Cancelled";
  }

  const exhaustiveCheck: never = status;
  return exhaustiveCheck;
}

function toDateTimeLocal(dateValue: string | Date): string {
  const date = new Date(dateValue);
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60_000)
    .toISOString()
    .slice(0, 16);
}

function formatPerthTime(dateValue: string | Date): string {
  return new Date(dateValue).toLocaleTimeString("en-AU", {
    timeZone: "Australia/Perth",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPerthDate(dateValue: string | Date): string {
  return new Date(dateValue).toLocaleDateString("en-AU", {
    timeZone: "Australia/Perth",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatPerthDateTime(
  dateValue: string | Date,
): string {
  return new Date(dateValue).toLocaleString("en-AU", {
    timeZone: "Australia/Perth",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

function getMinutesSince(dateValue: string | Date): number {
  return Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(dateValue).getTime()) / 60_000,
    ),
  );
}

function getOrderAgeLabel(
  dateValue: string | Date,
): string {
  const minutes = getMinutesSince(dateValue);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function getUrgencyClass(order: Order): string {
  if (
    order.status === "READY" &&
    new Date(order.pickupTime).getTime() < Date.now()
  ) {
    return "order-overdue";
  }

  const minutes = getMinutesSince(order.createdAt);

  if (
    ["RECEIVED", "ACCEPTED", "COOKING"].includes(
      order.status,
    )
  ) {
    if (minutes >= 30) {
      return "order-urgent";
    }

    if (minutes >= 15) {
      return "order-warning";
    }
  }

  return "";
}

function isTodayInPerth(
  dateValue: string | Date,
): boolean {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Perth",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    formatter.format(new Date(dateValue)) ===
    formatter.format(new Date())
  );
}

function sortOrders(
  orders: Order[],
  sortMode: SortMode,
): Order[] {
  return [...orders].sort((first, second) => {
    switch (sortMode) {
      case "NEWEST":
        return (
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
        );

      case "PICKUP_ASC":
        return (
          new Date(first.pickupTime).getTime() -
          new Date(second.pickupTime).getTime()
        );

      case "PICKUP_DESC":
        return (
          new Date(second.pickupTime).getTime() -
          new Date(first.pickupTime).getTime()
        );

      case "OLDEST":
      default:
        return (
          new Date(first.createdAt).getTime() -
          new Date(second.createdAt).getTime()
        );
    }
  });
}

export default function OrderBoard({
  initial,
}: {
  initial: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(initial);

  const [boardView, setBoardView] =
    useState<BoardView>("LIVE");

  const [search, setSearch] = useState("");

  const [paymentFilter, setPaymentFilter] =
    useState<PaymentFilter>("ALL");

  const [historyStatusFilter, setHistoryStatusFilter] =
    useState<HistoryStatusFilter>("ALL");

  const [sortMode, setSortMode] =
    useState<SortMode>("OLDEST");

  const [autoRefresh, setAutoRefresh] = useState(true);

  const [updatingId, setUpdatingId] = useState<
    string | null
  >(null);

  const [deletingId, setDeletingId] = useState<
    string | null
  >(null);

  const [editingOrder, setEditingOrder] =
    useState<Order | null>(null);

  const [editForm, setEditForm] =
    useState<EditableOrder | null>(null);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [kitchenStatus, setKitchenStatus] =
    useState<KitchenStatus>({
      isOpen: true,
      closedTitle: "Kitchen currently closed",
      closedNote:
        "Online ordering is unavailable right now. Please check again later.",
    });

  const [isUpdatingKitchen, setIsUpdatingKitchen] =
    useState(false);

  const [showKitchenSettings, setShowKitchenSettings] =
    useState(false);

  const refreshOrders = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/admin/orders", {
        cache: "no-store",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `Could not refresh orders (${response.status}).`,
        );
      }

      setOrders(result as Order[]);
      setError(null);
    } catch (refreshError) {
      console.error(
        "Could not refresh orders:",
        refreshError,
      );

      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Could not refresh orders.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const refreshKitchenStatus = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/admin/kitchen-status",
        {
          cache: "no-store",
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `Could not load kitchen status (${response.status}).`,
        );
      }

      setKitchenStatus(result as KitchenStatus);
    } catch (statusError) {
      console.error(
        "Could not load kitchen status:",
        statusError,
      );

      setError(
        statusError instanceof Error
          ? statusError.message
          : "Could not load kitchen status.",
      );
    }
  }, []);

  const refreshEverything = useCallback(async () => {
    await Promise.all([
      refreshOrders(),
      refreshKitchenStatus(),
    ]);
  }, [refreshOrders, refreshKitchenStatus]);

  useEffect(() => {
    void refreshKitchenStatus();
  }, [refreshKitchenStatus]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshOrders();
    }, 8_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [autoRefresh, refreshOrders]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 5_000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [successMessage]);

  async function updateStatus(
    order: Order,
    status: OrderStatus,
  ) {
    setUpdatingId(order.id);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `/api/admin/orders/${order.id}`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      const result =
        (await response.json().catch(() => null)) as
          | ApiResult
          | Order
          | null;

      if (!response.ok) {
        throw new Error(
          result &&
            "error" in result &&
            result.error
            ? result.error
            : `Could not update order (${response.status}).`,
        );
      }

      if (status === "READY") {
        const emailTriggered =
          result &&
          "readyEmailTriggered" in result &&
          result.readyEmailTriggered;

        setSuccessMessage(
          order.customerEmail
            ? emailTriggered
              ? `Order #${order.orderNumber} is ready and the customer email was triggered.`
              : `Order #${order.orderNumber} is ready. The email may already have been sent.`
            : `Order #${order.orderNumber} is ready, but no customer email is available.`,
        );
      } else if (status === "COLLECTED") {
        setSuccessMessage(
          `Order #${order.orderNumber} marked as collected.`,
        );
      } else if (status === "CANCELLED") {
        setSuccessMessage(
          `Order #${order.orderNumber} cancelled.`,
        );
      } else {
        setSuccessMessage(
          `Order #${order.orderNumber} moved to ${getStatusLabel(
            status,
          ).toLowerCase()}.`,
        );
      }

      await refreshOrders();
    } catch (updateError) {
      console.error(
        "Could not update order:",
        updateError,
      );

      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update order.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function toggleKitchen() {
    const nextOpenState = !kitchenStatus.isOpen;

    const confirmed = window.confirm(
      nextOpenState
        ? "Open the kitchen and allow customers to place online orders?"
        : "Close the kitchen and stop new online orders?",
    );

    if (!confirmed) {
      return;
    }

    setIsUpdatingKitchen(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        "/api/admin/kitchen-status",
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            ...kitchenStatus,
            isOpen: nextOpenState,
          }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Could not update kitchen status.",
        );
      }

      setKitchenStatus(result as KitchenStatus);

      setSuccessMessage(
        nextOpenState
          ? "Kitchen opened. Customers can place online orders."
          : "Kitchen closed. New online orders are disabled.",
      );
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Could not update kitchen status.",
      );
    } finally {
      setIsUpdatingKitchen(false);
    }
  }

  async function saveKitchenMessage() {
    setIsUpdatingKitchen(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        "/api/admin/kitchen-status",
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(kitchenStatus),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Could not save the customer message.",
        );
      }

      setKitchenStatus(result as KitchenStatus);
      setSuccessMessage("Kitchen customer message saved.");
    } catch (messageError) {
      setError(
        messageError instanceof Error
          ? messageError.message
          : "Could not save the customer message.",
      );
    } finally {
      setIsUpdatingKitchen(false);
    }
  }

  function openEditor(order: Order) {
    setEditingOrder(order);

    setEditForm({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail ?? "",
      pickupTime: toDateTimeLocal(order.pickupTime),
      notes: order.notes ?? "",
    });
  }

  function closeEditor() {
    setEditingOrder(null);
    setEditForm(null);
  }

  async function saveOrder(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingOrder || !editForm) {
      return;
    }

    setUpdatingId(editingOrder.id);
    setError(null);
    setSuccessMessage(null);

    try {
      const pickupDate = new Date(editForm.pickupTime);

      if (Number.isNaN(pickupDate.getTime())) {
        throw new Error("Please enter a valid pickup time.");
      }

      const response = await fetch(
        `/api/admin/orders/${editingOrder.id}`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            customerName:
              editForm.customerName.trim() || "Guest",
            customerPhone:
              editForm.customerPhone.trim() ||
              "Not provided",
            customerEmail:
              editForm.customerEmail.trim() || null,
            pickupTime: pickupDate.toISOString(),
            notes: editForm.notes.trim() || null,
          }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `Could not save order (${response.status}).`,
        );
      }

      setSuccessMessage(
        `Order #${editingOrder.orderNumber} updated.`,
      );

      closeEditor();
      await refreshOrders();
    } catch (saveError) {
      console.error("Could not save order:", saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save order.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteOrder(order: Order) {
    const confirmed = window.confirm(
      `Permanently delete order #${order.orderNumber}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(order.id);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `/api/admin/orders/${order.id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `Could not delete order (${response.status}).`,
        );
      }

      setOrders((currentOrders) =>
        currentOrders.filter(
          (candidate) => candidate.id !== order.id,
        ),
      );

      setSuccessMessage(
        `Order #${order.orderNumber} permanently deleted.`,
      );
    } catch (deleteError) {
      console.error(
        "Could not delete order:",
        deleteError,
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete order.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function restoreOrder(order: Order) {
    const restoredStatus: OrderStatus =
      order.paymentStatus === "PENDING"
        ? "PENDING_PAYMENT"
        : "RECEIVED";

    void updateStatus(order, restoredStatus);
  }

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesPayment =
        paymentFilter === "ALL" ||
        order.paymentStatus === paymentFilter;

      const searchableValues = [
        String(order.orderNumber),
        order.customerName,
        order.customerPhone,
        order.customerEmail ?? "",
        order.notes ?? "",
        ...order.lines.flatMap((line) => [
          line.name,
          line.notes ?? "",
        ]),
      ];

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableValues.some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );

      return matchesPayment && matchesSearch;
    });
  }, [orders, paymentFilter, search]);

  const liveOrders = useMemo(
    () =>
      filteredOrders.filter(
        (order) =>
          !historyStatuses.includes(order.status),
      ),
    [filteredOrders],
  );

  const historyOrders = useMemo(() => {
    const matchingOrders = filteredOrders
      .filter((order) =>
        historyStatuses.includes(order.status),
      )
      .filter(
        (order) =>
          historyStatusFilter === "ALL" ||
          order.status === historyStatusFilter,
      );

    return sortOrders(matchingOrders, sortMode);
  }, [
    filteredOrders,
    historyStatusFilter,
    sortMode,
  ]);

  const activeOrders = orders.filter((order) =>
    ["RECEIVED", "ACCEPTED", "COOKING", "READY"].includes(
      order.status,
    ),
  );

  const awaitingPayment = orders.filter(
    (order) => order.status === "PENDING_PAYMENT",
  );

  const newOrders = orders.filter(
    (order) => order.status === "RECEIVED",
  );

  const cookingOrders = orders.filter(
    (order) => order.status === "COOKING",
  );

  const readyOrders = orders.filter(
    (order) => order.status === "READY",
  );

  const collectedToday = orders.filter(
    (order) =>
      order.status === "COLLECTED" &&
      isTodayInPerth(order.createdAt),
  );

  const paidSales = orders
    .filter(
      (order) =>
        order.paymentStatus === "PAID" ||
        order.paymentStatus === "PAY_AT_PICKUP",
    )
    .reduce((sum, order) => sum + order.totalCents, 0);

  return (
    <main className="order-board-page">
      <section className="order-board-hero">
        <div className="order-board-hero-copy">
          <p className="board-kicker">
            BROKEN HILL HOTEL
          </p>

          <h1>Kitchen order board</h1>

          <p>
            Track every order from payment confirmation
            through preparation and customer collection.
          </p>
        </div>

        <div className="order-board-hero-actions">
          <label className="auto-refresh-control">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(event) =>
                setAutoRefresh(event.target.checked)
              }
            />

            <span>
              {autoRefresh
                ? "Auto-refresh on"
                : "Auto-refresh off"}
            </span>
          </label>

          <button
            className="refresh-button"
            type="button"
            onClick={refreshEverything}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>

      <section
        className={`kitchen-control ${
          kitchenStatus.isOpen
            ? "kitchen-control-open"
            : "kitchen-control-closed"
        }`}
      >
        <div className="kitchen-control-status">
          <span className="kitchen-status-dot" />

          <div>
            <strong>
              {kitchenStatus.isOpen
                ? "Kitchen open"
                : "Kitchen closed"}
            </strong>

            <small>
              {kitchenStatus.isOpen
                ? "Customers can place online orders"
                : "New online orders are disabled"}
            </small>
          </div>
        </div>

        <div className="kitchen-control-actions">
          <button
            type="button"
            className="kitchen-settings-button"
            onClick={() =>
              setShowKitchenSettings(
                (current) => !current,
              )
            }
          >
            {showKitchenSettings
              ? "Hide message"
              : "Edit closed message"}
          </button>

          <button
            type="button"
            className={
              kitchenStatus.isOpen
                ? "close-kitchen-button"
                : "open-kitchen-button"
            }
            disabled={isUpdatingKitchen}
            onClick={toggleKitchen}
          >
            {isUpdatingKitchen
              ? "Updating…"
              : kitchenStatus.isOpen
                ? "Close kitchen"
                : "Open kitchen"}
          </button>
        </div>
      </section>

      {showKitchenSettings && (
        <section className="kitchen-message-panel">
          <div>
            <p className="board-kicker">
              CUSTOMER MESSAGE
            </p>

            <h2>Kitchen closed message</h2>

            <p>
              Customers see this message when online ordering
              is disabled.
            </p>
          </div>

          <div className="kitchen-message-fields">
            <label>
              <span>Heading</span>

              <input
                value={kitchenStatus.closedTitle}
                onChange={(event) =>
                  setKitchenStatus((current) => ({
                    ...current,
                    closedTitle: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              <span>Message</span>

              <textarea
                rows={4}
                value={kitchenStatus.closedNote}
                onChange={(event) =>
                  setKitchenStatus((current) => ({
                    ...current,
                    closedNote: event.target.value,
                  }))
                }
              />
            </label>

            <button
              type="button"
              className="primary-action"
              disabled={isUpdatingKitchen}
              onClick={saveKitchenMessage}
            >
              {isUpdatingKitchen
                ? "Saving…"
                : "Save customer message"}
            </button>
          </div>
        </section>
      )}

      {error && (
        <div className="board-alert board-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="board-alert board-success">
          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <section className="stat-grid modern-stats">
        <article className="stat stat-primary">
          <span>Active orders</span>
          <strong>{activeOrders.length}</strong>
          <small>Currently in the kitchen</small>
        </article>

        <article className="stat">
          <span>Awaiting payment</span>
          <strong>{awaitingPayment.length}</strong>
          <small>Do not begin preparation</small>
        </article>

        <article className="stat">
          <span>New orders</span>
          <strong>{newOrders.length}</strong>
          <small>Waiting for acceptance</small>
        </article>

        <article className="stat">
          <span>Cooking</span>
          <strong>{cookingOrders.length}</strong>
          <small>Being prepared now</small>
        </article>

        <article className="stat stat-ready">
          <span>Ready</span>
          <strong>{readyOrders.length}</strong>
          <small>Waiting for collection</small>
        </article>

        <article className="stat">
          <span>Collected today</span>
          <strong>{collectedToday.length}</strong>
          <small>Completed orders</small>
        </article>

        <article className="stat stat-value">
          <span>Order value</span>
          <strong>{formatMoney(paidSales)}</strong>
          <small>Paid and pay-at-pickup</small>
        </article>
      </section>

      <section className="board-view-switcher">
        <button
          type="button"
          className={boardView === "LIVE" ? "active" : ""}
          onClick={() => setBoardView("LIVE")}
        >
          <span>Live orders</span>
          <strong>{liveOrders.length}</strong>
        </button>

        <button
          type="button"
          className={
            boardView === "HISTORY" ? "active" : ""
          }
          onClick={() => setBoardView("HISTORY")}
        >
          <span>Past orders</span>
          <strong>
            {
              orders.filter((order) =>
                historyStatuses.includes(order.status),
              ).length
            }
          </strong>
        </button>
      </section>

      <section className="board-controls">
        <label className="search-control">
          <span>Search orders</span>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Order number, customer, phone or item"
          />
        </label>

        <label className="filter-control">
          <span>Payment status</span>

          <select
            value={paymentFilter}
            onChange={(event) =>
              setPaymentFilter(
                event.target.value as PaymentFilter,
              )
            }
          >
            <option value="ALL">All payments</option>
            <option value="PAID">Paid online</option>
            <option value="PENDING">
              Awaiting payment
            </option>
            <option value="PAY_AT_PICKUP">
              Pay at pickup
            </option>
            <option value="FAILED">
              Payment failed
            </option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </label>

        {boardView === "HISTORY" && (
          <>
            <label className="filter-control">
              <span>Order status</span>

              <select
                value={historyStatusFilter}
                onChange={(event) =>
                  setHistoryStatusFilter(
                    event.target
                      .value as HistoryStatusFilter,
                  )
                }
              >
                <option value="ALL">
                  All past orders
                </option>
                <option value="COLLECTED">
                  Collected
                </option>
                <option value="CANCELLED">
                  Cancelled
                </option>
                <option value="PAYMENT_FAILED">
                  Payment failed
                </option>
              </select>
            </label>

            <label className="filter-control">
              <span>Sort orders</span>

              <select
                value={sortMode}
                onChange={(event) =>
                  setSortMode(
                    event.target.value as SortMode,
                  )
                }
              >
                <option value="NEWEST">
                  Newest first
                </option>
                <option value="OLDEST">
                  Oldest first
                </option>
                <option value="PICKUP_ASC">
                  Pickup time earliest
                </option>
                <option value="PICKUP_DESC">
                  Pickup time latest
                </option>
              </select>
            </label>
          </>
        )}
      </section>

      {boardView === "LIVE" && (
        <div className="modern-board">
          {liveColumns.map((column) => {
            const columnOrders = sortOrders(
              liveOrders.filter(
                (order) =>
                  order.status === column.status,
              ),
              column.status === "READY"
                ? "PICKUP_ASC"
                : "OLDEST",
            );

            return (
              <section
                className={`modern-column column-${column.status.toLowerCase()}`}
                key={column.status}
              >
                <header className="modern-column-head">
                  <div>
                    <h2>{column.title}</h2>
                    <p>{column.description}</p>
                  </div>

                  <span className="column-count">
                    {columnOrders.length}
                  </span>
                </header>

                <div className="column-order-list">
                  {columnOrders.length === 0 && (
                    <div className="empty-column">
                      <span>0</span>
                      <p>No orders in this stage</p>
                    </div>
                  )}

                  {columnOrders.map((order) => {
                    const followingStatus =
                      nextStatus[order.status];

                    const actionLabel =
                      getActionLabel(order.status);

                    const isAwaitingPayment =
                      order.status ===
                      "PENDING_PAYMENT";

                    const isUpdating =
                      updatingId === order.id;

                    const isDeleting =
                      deletingId === order.id;

                    const urgencyClass =
                      getUrgencyClass(order);

                    return (
                      <article
                        className={`modern-order-card ${urgencyClass} ${
                          isAwaitingPayment
                            ? "payment-pending-card"
                            : ""
                        }`}
                        key={order.id}
                      >
                        <header className="order-card-header">
                          <div>
                            <p className="order-number">
                              Order #{order.orderNumber}
                            </p>

                            <span className="order-created">
                              {formatPerthTime(
                                order.createdAt,
                              )}
                              {" · "}
                              {getOrderAgeLabel(
                                order.createdAt,
                              )}
                            </span>
                          </div>

                          <span
                            className={`payment-status payment-${order.paymentStatus.toLowerCase()}`}
                          >
                            {getPaymentLabel(
                              order.paymentStatus,
                            )}
                          </span>
                        </header>

                        {urgencyClass && (
                          <div className="order-urgency-banner">
                            {urgencyClass ===
                            "order-overdue"
                              ? "Pickup time has passed"
                              : urgencyClass ===
                                  "order-urgent"
                                ? "Order waiting over 30 minutes"
                                : "Order waiting over 15 minutes"}
                          </div>
                        )}

                        <div className="customer-block">
                          <div>
                            <strong>
                              {order.customerName}
                            </strong>

                            <span>
                              Pickup{" "}
                              {formatPerthTime(
                                order.pickupTime,
                              )}
                            </span>
                          </div>

                          <div className="customer-shortcuts">
                            {order.customerPhone &&
                              order.customerPhone !==
                                "Not provided" && (
                                <a
                                  href={`tel:${order.customerPhone}`}
                                >
                                  Call
                                </a>
                              )}

                            {order.customerEmail && (
                              <a
                                href={`mailto:${order.customerEmail}`}
                              >
                                Email
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="order-line-list">
                          {order.lines.map(
                            (line, index) => (
                              <div
                                className="order-line"
                                key={
                                  line.id ||
                                  `${order.id}-${index}`
                                }
                              >
                                <span className="line-quantity">
                                  {line.quantity}×
                                </span>

                                <div>
                                  <strong>
                                    {line.name}
                                  </strong>

                                  {line.notes && (
                                    <small>
                                      {line.notes}
                                    </small>
                                  )}
                                </div>

                                <span>
                                  {formatMoney(
                                    line.unitPriceCents *
                                      line.quantity,
                                  )}
                                </span>
                              </div>
                            ),
                          )}
                        </div>

                        {order.notes && (
                          <div className="order-note">
                            <span>Order note</span>
                            <p>{order.notes}</p>
                          </div>
                        )}

                        {isAwaitingPayment && (
                          <div className="payment-warning">
                            <strong>
                              Payment not confirmed
                            </strong>

                            <span>
                              Do not prepare this order until
                              Stripe confirms payment.
                            </span>
                          </div>
                        )}

                        <footer className="order-card-footer">
                          <div className="order-summary">
                            <span>
                              {getStatusLabel(
                                order.status,
                              )}
                            </span>

                            <strong>
                              {formatMoney(
                                order.totalCents,
                              )}
                            </strong>
                          </div>

                          <div className="order-actions">
                            {followingStatus &&
                              actionLabel &&
                              !isAwaitingPayment && (
                                <button
                                  className={
                                    order.status ===
                                    "COOKING"
                                      ? "ready-action"
                                      : "primary-action"
                                  }
                                  type="button"
                                  disabled={
                                    isUpdating ||
                                    isDeleting
                                  }
                                  onClick={() =>
                                    updateStatus(
                                      order,
                                      followingStatus,
                                    )
                                  }
                                >
                                  {isUpdating
                                    ? "Updating…"
                                    : actionLabel}
                                </button>
                              )}

                            <button
                              className="secondary-action"
                              type="button"
                              disabled={
                                isUpdating || isDeleting
                              }
                              onClick={() =>
                                updateStatus(
                                  order,
                                  "CANCELLED",
                                )
                              }
                            >
                              Cancel
                            </button>

                            <button
                              className="edit-action"
                              type="button"
                              disabled={
                                isUpdating || isDeleting
                              }
                              onClick={() =>
                                openEditor(order)
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="delete-action"
                              type="button"
                              disabled={
                                isUpdating || isDeleting
                              }
                              onClick={() =>
                                deleteOrder(order)
                              }
                            >
                              {isDeleting
                                ? "Deleting…"
                                : "Delete"}
                            </button>
                          </div>
                        </footer>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {boardView === "HISTORY" && (
        <section className="past-orders-panel">
          <header className="past-orders-header">
            <div>
              <p className="board-kicker">
                ORDER HISTORY
              </p>

              <h2>Past orders</h2>

              <p>
                Collected, cancelled and unsuccessful
                customer orders.
              </p>
            </div>

            <span className="past-order-total">
              {historyOrders.length} orders
            </span>
          </header>

          {historyOrders.length === 0 ? (
            <div className="past-orders-empty">
              <span>✓</span>
              <h3>No past orders found</h3>
              <p>
                Completed and cancelled orders will appear
                here.
              </p>
            </div>
          ) : (
            <div className="past-order-list">
              {historyOrders.map((order) => {
                const isUpdating =
                  updatingId === order.id;

                const isDeleting =
                  deletingId === order.id;

                return (
                  <article
                    className={`past-order-row past-${order.status.toLowerCase()}`}
                    key={order.id}
                  >
                    <div className="past-order-main">
                      <div className="past-order-number">
                        <span>Order</span>
                        <strong>
                          #{order.orderNumber}
                        </strong>
                      </div>

                      <div className="past-order-customer">
                        <strong>
                          {order.customerName}
                        </strong>

                        <span>
                          {order.customerPhone}

                          {order.customerEmail
                            ? ` · ${order.customerEmail}`
                            : ""}
                        </span>
                      </div>

                      <div className="past-order-date">
                        <strong>
                          {formatPerthDate(
                            order.createdAt,
                          )}
                        </strong>

                        <span>
                          {formatPerthTime(
                            order.createdAt,
                          )}
                        </span>
                      </div>

                      <span
                        className={`order-history-status status-${order.status.toLowerCase()}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>

                      <div className="past-order-total-value">
                        <span>
                          {order.lines.reduce(
                            (sum, line) =>
                              sum + line.quantity,
                            0,
                          )}{" "}
                          items
                        </span>

                        <strong>
                          {formatMoney(
                            order.totalCents,
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="past-order-items">
                      {order.lines.map(
                        (line, index) => (
                          <span
                            key={
                              line.id ||
                              `${order.id}-${index}`
                            }
                          >
                            {line.quantity}×{" "}
                            {line.name}
                          </span>
                        ),
                      )}
                    </div>

                    {order.notes && (
                      <div className="order-note">
                        <span>Order note</span>
                        <p>{order.notes}</p>
                      </div>
                    )}

                    <footer className="past-order-actions">
                      <div>
                        <span>
                          Pickup{" "}
                          {formatPerthDateTime(
                            order.pickupTime,
                          )}
                        </span>

                        <span>
                          {getPaymentLabel(
                            order.paymentStatus,
                          )}
                        </span>
                      </div>

                      <div>
                        {order.status !==
                          "PAYMENT_FAILED" && (
                          <button
                            className="restore-action"
                            type="button"
                            disabled={
                              isUpdating || isDeleting
                            }
                            onClick={() =>
                              restoreOrder(order)
                            }
                          >
                            {isUpdating
                              ? "Restoring…"
                              : "Restore"}
                          </button>
                        )}

                        <button
                          className="edit-action"
                          type="button"
                          disabled={
                            isUpdating || isDeleting
                          }
                          onClick={() =>
                            openEditor(order)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-action"
                          type="button"
                          disabled={
                            isUpdating || isDeleting
                          }
                          onClick={() =>
                            deleteOrder(order)
                          }
                        >
                          {isDeleting
                            ? "Deleting…"
                            : "Delete"}
                        </button>
                      </div>
                    </footer>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {editingOrder && editForm && (
        <div
          className="order-modal-backdrop"
          role="presentation"
          onMouseDown={closeEditor}
        >
          <section
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-order-heading"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header>
              <div>
                <p className="board-kicker">
                  EDIT ORDER
                </p>

                <h2 id="edit-order-heading">
                  Order #{editingOrder.orderNumber}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEditor}
                aria-label="Close editor"
              >
                ×
              </button>
            </header>

            <form onSubmit={saveOrder}>
              <div className="modal-field-grid">
                <label>
                  <span>Customer name</span>

                  <input
                    required
                    value={editForm.customerName}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        customerName:
                          event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  <span>Phone number</span>

                  <input
                    required
                    value={editForm.customerPhone}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        customerPhone:
                          event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  <span>Email address</span>

                  <input
                    type="email"
                    value={editForm.customerEmail}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        customerEmail:
                          event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  <span>Pickup time</span>

                  <input
                    required
                    type="datetime-local"
                    value={editForm.pickupTime}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        pickupTime:
                          event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label className="modal-notes-field">
                <span>Order notes</span>

                <textarea
                  rows={4}
                  value={editForm.notes}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      notes: event.target.value,
                    })
                  }
                  placeholder="Add kitchen or customer notes"
                />
              </label>

              <footer>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={closeEditor}
                >
                  Close
                </button>

                <button
                  className="primary-action"
                  type="submit"
                  disabled={
                    updatingId === editingOrder.id
                  }
                >
                  {updatingId === editingOrder.id
                    ? "Saving…"
                    : "Save changes"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}