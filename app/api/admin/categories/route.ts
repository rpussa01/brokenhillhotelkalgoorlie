import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { name } = await request.json();

  const cleanName = String(name || "").trim();

  if (cleanName.length < 2) {
    return NextResponse.json(
      { error: "Enter a category name." },
      { status: 400 },
    );
  }

  const exists = await prisma.category.findFirst({
    where: {
      name: {
        equals: cleanName,
        mode: "insensitive",
      },
    },
  });

  if (exists) {
    return NextResponse.json(
      { error: "That category already exists." },
      { status: 409 },
    );
  }

  const count = await prisma.category.count();

  const category = await prisma.category.create({
    data: {
      name: cleanName,
      active: true,
      displayOrder: count,
    },
  });

  return NextResponse.json(category, {
    status: 201,
  });
}