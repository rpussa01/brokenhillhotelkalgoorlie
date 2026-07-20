import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const menuItemSelect = {
  id: true,
  categoryId: true,
  name: true,
  description: true,
  imageUrl: true,
  priceCents: true,
  available: true,
  dietary: true,
  displayOrder: true,
  featured: true,
  chefFavourite: true,
  popular: true,
  dineInOnly: true,
  takeaway: true,
} as const;

const patchMenuItemSchema = z
  .object({
    categoryId: z.string().trim().min(1).optional(),

    name: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    description: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional(),

    imageUrl: z
      .string()
      .trim()
      .nullable()
      .optional(),

    priceCents: z
      .number()
      .int()
      .nonnegative()
      .optional(),

    available: z.boolean().optional(),

    dietary: z
      .array(z.string())
      .optional(),

    displayOrder: z
      .number()
      .int()
      .optional(),

    // Temporary backwards compatibility.
    // Older MenuManager versions sent sortOrder.
    sortOrder: z
      .number()
      .int()
      .optional(),

    featured: z.boolean().optional(),
    chefFavourite: z.boolean().optional(),
    popular: z.boolean().optional(),

    dineInOnly: z.boolean().optional(),
    takeaway: z.boolean().optional(),
  })
  .strict();

function normaliseNullableString(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function normaliseDietaryTags(
  tags: string[] | undefined,
): string[] | undefined {
  if (tags === undefined) {
    return undefined;
  }

  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toUpperCase())
        .filter(Boolean),
    ),
  );
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Menu item ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON request body.",
        },
        {
          status: 400,
        },
      );
    }

    const parsed = patchMenuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please check the menu item details.",
          details: parsed.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const existingItem =
      await prisma.menuItem.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          categoryId: true,
          dineInOnly: true,
          takeaway: true,
        },
      });

    if (!existingItem) {
      return NextResponse.json(
        {
          error: "Menu item not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (parsed.data.categoryId) {
      const category =
        await prisma.category.findUnique({
          where: {
            id: parsed.data.categoryId,
          },
          select: {
            id: true,
          },
        });

      if (!category) {
        return NextResponse.json(
          {
            error: "Category not found.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const requestedDisplayOrder =
      parsed.data.displayOrder ??
      parsed.data.sortOrder;

    const nextDineInOnly =
      parsed.data.dineInOnly ??
      existingItem.dineInOnly;

    const requestedTakeaway =
      parsed.data.takeaway ??
      existingItem.takeaway;

    const nextTakeaway = nextDineInOnly
      ? false
      : requestedTakeaway;

    const data: {
      categoryId?: string;
      name?: string;
      description?: string | null;
      imageUrl?: string | null;
      priceCents?: number;
      available?: boolean;
      dietary?: string[];
      displayOrder?: number;
      featured?: boolean;
      chefFavourite?: boolean;
      popular?: boolean;
      dineInOnly?: boolean;
      takeaway?: boolean;
    } = {};

    if (parsed.data.categoryId !== undefined) {
      data.categoryId =
        parsed.data.categoryId;
    }

    if (parsed.data.name !== undefined) {
      data.name = parsed.data.name;
    }

    if (
      parsed.data.description !== undefined
    ) {
      data.description =
        normaliseNullableString(
          parsed.data.description,
        );
    }

    if (parsed.data.imageUrl !== undefined) {
      data.imageUrl =
        normaliseNullableString(
          parsed.data.imageUrl,
        );
    }

    if (
      parsed.data.priceCents !== undefined
    ) {
      data.priceCents =
        parsed.data.priceCents;
    }

    if (
      parsed.data.available !== undefined
    ) {
      data.available =
        parsed.data.available;
    }

    if (parsed.data.dietary !== undefined) {
      data.dietary =
        normaliseDietaryTags(
          parsed.data.dietary,
        );
    }

    if (
      requestedDisplayOrder !== undefined
    ) {
      data.displayOrder =
        requestedDisplayOrder;
    }

    if (
      parsed.data.featured !== undefined
    ) {
      data.featured =
        parsed.data.featured;
    }

    if (
      parsed.data.chefFavourite !==
      undefined
    ) {
      data.chefFavourite =
        parsed.data.chefFavourite;
    }

    if (
      parsed.data.popular !== undefined
    ) {
      data.popular =
        parsed.data.popular;
    }

    if (
      parsed.data.dineInOnly !==
        undefined ||
      parsed.data.takeaway !== undefined
    ) {
      data.dineInOnly =
        nextDineInOnly;

      data.takeaway =
        nextTakeaway;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          error: "No valid changes were supplied.",
        },
        {
          status: 400,
        },
      );
    }

    const updatedItem =
      await prisma.menuItem.update({
        where: {
          id,
        },
        data,
        select: menuItemSelect,
      });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error(
      "PATCH menu item error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update menu item.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Menu item ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const existingItem =
      await prisma.menuItem.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });

    if (!existingItem) {
      return NextResponse.json(
        {
          error: "Menu item not found.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.menuItem.delete({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE menu item error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "This item may already be attached to an order and cannot be deleted. Hide it instead.",
      },
      {
        status: 409,
      },
    );
  }
}