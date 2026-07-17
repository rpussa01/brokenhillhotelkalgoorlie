"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Order, OrderStatus } from "@/lib/types";

type PaymentFilter =
  | "ALL"
  | "PAID"
  | "PENDING"
  | "PAY_AT_PICKUP"
  | "FAILED"
  | "REFUNDED";

type EditableOrder = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupTime: string;
  notes: string;
};

type OrderColumn = {
  status: OrderStatus;
  title: string;
  description: string;
};

const columns: OrderColumn[] = [
  {
    status: "PENDING_PAYMENT",
    title: "Awaiting payment",
    description: "Online orders waiting for confirmation",
  },
  {
    status: "RECEIVED",
    title: "New orders",
    description: "Paid or pay-at-pickup orders",
  },
  {
    status: "ACCEPTED",
    title: "Accepted",
    description: "Confirmed by the kitchen",
  },
  {
    status: "COOKING",
    title: "Cooking",
    description: "Currently being prepared",
  },
  {
    status: "READY",
    title: "Ready",
    description: "Ready for customer collection",
  },
  {
    status: "CANCELLED",
    title: "Cancelled",
    description: "Cancelled and rejected orders",
  },
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
      return "Mark ready";

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
      return "New";

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

  const localDate = new Date(
    date.getTime() - offset * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}

function formatPerthTime(dateValue: string | Date): string {
  return new Date(dateValue).toLocaleTimeString("en-AU", {
    timeZone: "Australia/Perth",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(cents: number): string {
  return `A$${(cents / 100).toFixed(2)}`;
}

export default function OrderBoard({
  initial,
}: {
  initial: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(initial);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] =
    useState<PaymentFilter>("ALL");

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

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const refresh = useCallback(async () => {
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
      console.error("Could not refresh orders:", refreshError);

      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Could not refresh orders.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(refresh, 8_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [refresh]);

  async function updateStatus(
    id: string,
    status: OrderStatus,
  ) {
    setUpdatingId(id);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/orders/${id}`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `Could not update order (${response.status}).`,
        );
      }

      await refresh();
    } catch (updateError) {
      console.error("Could not update order:", updateError);

      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update order.",
      );
    } finally {
      setUpdatingId(null);
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

      closeEditor();
      await refresh();
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
    } catch (deleteError) {
      console.error("Could not delete order:", deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete order.",
      );
    } finally {
      setDeletingId(null);
    }
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
        ...order.lines.map((line) => line.name),
      ];

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableValues.some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );

      return matchesPayment && matchesSearch;
    });
  }, [orders, paymentFilter, search]);

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

  const readyOrders = orders.filter(
    (order) => order.status === "READY",
  );

  const paidSales = orders
    .filter(
      (order) =>
        order.paymentStatus === "PAID" ||
        order.paymentStatus === "PAY_AT_PICKUP",
    )
    .reduce((sum, order) => sum + order.totalCents, 0);

  return (
    <div className="order-board-page">
      <section className="order-board-toolbar">
        <div>
          <p className="board-kicker">LIVE OPERATIONS</p>

          <h1>Order board</h1>

          <p className="board-subtitle">
            Manage incoming orders from payment to collection.
          </p>
        </div>

        <button
          className="refresh-button"
          type="button"
          onClick={refresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing…" : "Refresh orders"}
        </button>
      </section>

      {error && (
        <div className="board-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <section className="stat-grid modern-stats">
        <article className="stat">
          <span>Active orders</span>
          <strong>{activeOrders.length}</strong>
          <small>Currently in the kitchen</small>
        </article>

        <article className="stat">
          <span>Awaiting payment</span>
          <strong>{awaitingPayment.length}</strong>
          <small>Not ready for preparation</small>
        </article>

        <article className="stat">
          <span>New orders</span>
          <strong>{newOrders.length}</strong>
          <small>Ready to accept</small>
        </article>

        <article className="stat">
          <span>Ready</span>
          <strong>{readyOrders.length}</strong>
          <small>Awaiting collection</small>
        </article>

        <article className="stat stat-value">
          <span>Order value</span>
          <strong>{formatMoney(paidSales)}</strong>
          <small>Paid and pay-at-pickup</small>
        </article>
      </section>

      <section className="board-controls">
        <label className="search-control">
          <span>Search orders</span>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Order number, customer or item"
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
            <option value="PENDING">Awaiting payment</option>
            <option value="PAY_AT_PICKUP">
              Pay at pickup
            </option>
            <option value="FAILED">Payment failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </label>
      </section>

      <div className="modern-board">
        {columns.map((column) => {
          const columnOrders = filteredOrders
            .filter(
              (order) => order.status === column.status,
            )
            .sort((first, second) =>
              first.createdAt.localeCompare(
                second.createdAt,
              ),
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
                    order.status === "PENDING_PAYMENT";

                  const isCancelled =
                    order.status === "CANCELLED";

                  const isUpdating =
                    updatingId === order.id;

                  const isDeleting =
                    deletingId === order.id;

                  return (
                    <article
                      className={`modern-order-card ${
                        isAwaitingPayment
                          ? "payment-pending-card"
                          : ""
                      } ${
                        isCancelled
                          ? "cancelled-order-card"
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
                            {formatPerthTime(order.createdAt)}
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

                      <div className="customer-block">
                        <strong>{order.customerName}</strong>

                        <span>
                          Pickup{" "}
                          {formatPerthTime(order.pickupTime)}
                        </span>
                      </div>

                      <div className="order-line-list">
                        {order.lines.map((line, index) => (
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
                              <strong>{line.name}</strong>

                              {line.notes && (
                                <small>{line.notes}</small>
                              )}
                            </div>

                            <span>
                              {formatMoney(
                                line.unitPriceCents *
                                  line.quantity,
                              )}
                            </span>
                          </div>
                        ))}
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
                            Stripe confirms the payment.
                          </span>
                        </div>
                      )}

                      <footer className="order-card-footer">
                        <div>
                          <span>
                            {getStatusLabel(order.status)}
                          </span>

                          <strong>
                            {formatMoney(order.totalCents)}
                          </strong>
                        </div>

                        <div className="order-actions">
                          {followingStatus &&
                            actionLabel &&
                            !isAwaitingPayment &&
                            !isCancelled && (
                              <button
                                className={
                                  order.status === "COOKING"
                                    ? "ready-action"
                                    : "primary-action"
                                }
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateStatus(
                                    order.id,
                                    followingStatus,
                                  )
                                }
                              >
                                {isUpdating
                                  ? "Updating…"
                                  : actionLabel}
                              </button>
                            )}

                          {isCancelled ? (
                            <button
                              className="restore-action"
                              type="button"
                              disabled={isUpdating}
                              onClick={() =>
                                updateStatus(
                                  order.id,
                                  order.paymentStatus ===
                                    "PENDING"
                                    ? "PENDING_PAYMENT"
                                    : "RECEIVED",
                                )
                              }
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              className="secondary-action"
                              type="button"
                              disabled={
                                isUpdating || isDeleting
                              }
                              onClick={() =>
                                updateStatus(
                                  order.id,
                                  "CANCELLED",
                                )
                              }
                            >
                              Cancel
                            </button>
                          )}

                          <button
                            className="edit-action"
                            type="button"
                            disabled={
                              isUpdating || isDeleting
                            }
                            onClick={() => openEditor(order)}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-action"
                            type="button"
                            disabled={
                              isUpdating || isDeleting
                            }
                            onClick={() => deleteOrder(order)}
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
                <p className="board-kicker">EDIT ORDER</p>

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
                        customerName: event.target.value,
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
                        customerPhone: event.target.value,
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
                        customerEmail: event.target.value,
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
                        pickupTime: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label>
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
    </div>
  );
}