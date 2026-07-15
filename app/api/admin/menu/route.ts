import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { menuItemSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json();
  const parsed = menuItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the menu item details.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

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

  const item = await prisma.menuItem.create({
    data: {
      ...parsed.data,
      imageUrl: parsed.data.imageUrl || null,
      dietary: parsed.data.dietary ?? [],
    },
  });

  return NextResponse.json(item, { status: 201 });
}