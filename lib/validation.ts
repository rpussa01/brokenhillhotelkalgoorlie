import { z } from "zod";

export const orderSchema = z.object({
  customerName: z.string().min(2).max(80),
  customerPhone: z.string().min(8).max(30),
  customerEmail: z.string().email().optional().or(z.literal("")),
  pickupTime: z.string().min(1),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(["ONLINE", "PICKUP"]),
  lines: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().min(1).max(20),
    notes: z.string().max(200).optional()
  })).min(1)
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