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

  const item = await prisma.menuItem.update({
    where: { id },
    data: {
      ...parsed.data,
      imageUrl:
        parsed.data.imageUrl === undefined
          ? undefined
          : parsed.data.imageUrl || null,
      dietary:
        parsed.data.dietary === undefined
          ? undefined
          : parsed.data.dietary,
    },
  });

  return NextResponse.json(item);
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

  try {
    await prisma.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "This item may already be attached to an order and cannot be deleted. Hide it instead.",
      },
      { status: 409 },
    );
  }
}