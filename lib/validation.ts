import { z } from "zod";



const orderLineSchema = z
  .object({
    itemId: z
      .string()
      .trim()
      .min(1)
      .optional(),

    specialId: z
      .string()
      .trim()
      .min(1)
      .optional(),

    quantity: z
      .number()
      .int()
      .min(1)
      .max(20),

    notes: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional(),
  })
  .superRefine((line, context) => {
    const hasItemId =
      typeof line.itemId === "string" &&
      line.itemId.length > 0;

    const hasSpecialId =
      typeof line.specialId === "string" &&
      line.specialId.length > 0;

    /*
     * Exactly one must be present:
     * normal menu item OR special.
     */
    if (hasItemId === hasSpecialId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["itemId"],
        message:
          "Each order line must contain either itemId or specialId.",
      });
    }
  });

export const orderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100),

  customerPhone: z
    .string()
    .trim()
    .min(6, "Mobile number is required.")
    .max(30),

  customerEmail: z
    .union([
      z.string().trim().email(
        "Enter a valid email address.",
      ),
      z.literal(""),
      z.null(),
    ])
    .optional(),

  /*
   * datetime-local submits:
   * 2026-07-17T12:15
   *
   * Do not use z.string().datetime() here because
   * datetime-local does not include a timezone.
   */
  pickupTime: z
    .string()
    .trim()
    .min(1, "Pickup time is required."),

  notes: z
    .union([
      z.string().trim().max(1000),
      z.null(),
    ])
    .optional(),

  paymentMethod: z.enum([
    "ONLINE",
    "PICKUP",
  ]),

  lines: z
    .array(orderLineSchema)
    .min(1, "Your cart is empty."),
});

export const menuItemSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1),
  name: z.string().min(2).max(100),
  description: z.string().max(300),

  imageUrl: z
    .string()
    .trim()
    .url("Enter a valid image URL")
    .nullable()
    .optional(),

  priceCents: z.number().int().min(0),
  active: z.boolean(),
  soldOut: z.boolean(),
  dietary: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
});