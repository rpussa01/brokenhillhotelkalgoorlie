import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const specialUpdateSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  price: z.number().min(0).optional(),
  day: z.string().trim().max(60).nullable().optional(),
  badge: z.string().trim().max(60).nullable().optional(),
  imageUrl: z.string().trim().url().nullable().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = specialUpdateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the chef special details.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const existing = await prisma.special.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json(
      { error: "Chef special not found." },
      { status: 404 },
    );
  }

  const special = await prisma.special.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(special);
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.special.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json(
      { error: "Chef special not found." },
      { status: 404 },
    );
  }

  await prisma.special.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
