import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { menuItemSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const body = await request.json();

  const parsed = menuItemSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the menu item details.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const existingItem = await prisma.menuItem.findUnique({
    where: { id },
  });

  if (!existingItem) {
    return NextResponse.json(
      { error: "Menu item not found." },
      { status: 404 },
    );
  }

  if (parsed.data.categoryId) {
    const category = await prisma.category.findUnique({
      where: {
        id: parsed.data.categoryId,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 400 },
      );
    }
  }

  const updatedItem = await prisma.menuItem.update({
    where: {
      id,
    },
    data: {
      ...(parsed.data.categoryId !== undefined && {
        categoryId: parsed.data.categoryId,
      }),

      ...(parsed.data.name !== undefined && {
        name: parsed.data.name,
      }),

      ...(parsed.data.description !== undefined && {
        description: parsed.data.description,
      }),

      ...(parsed.data.imageUrl !== undefined && {
        imageUrl: parsed.data.imageUrl || null,
      }),

      ...(parsed.data.priceCents !== undefined && {
        priceCents: parsed.data.priceCents,
      }),

      ...(parsed.data.active !== undefined && {
        active: parsed.data.active,
      }),

      ...(parsed.data.soldOut !== undefined && {
        soldOut: parsed.data.soldOut,
      }),

      ...(parsed.data.dietary !== undefined && {
        dietary: parsed.data.dietary ?? [],
      }),

      ...(parsed.data.sortOrder !== undefined && {
        sortOrder: parsed.data.sortOrder,
      }),
    },
  });

  return NextResponse.json(updatedItem);
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;

  const existingItem = await prisma.menuItem.findUnique({
    where: { id },
  });

  if (!existingItem) {
    return NextResponse.json(
      { error: "Menu item not found." },
      { status: 404 },
    );
  }

  const linkedOrderLines = await prisma.orderLine.count({
    where: {
      itemId: id,
    },
  });

  if (linkedOrderLines > 0) {
    return NextResponse.json(
      {
        error:
          "This menu item has existing orders and cannot be deleted. Hide it instead.",
      },
      { status: 409 },
    );
  }

  await prisma.menuItem.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}