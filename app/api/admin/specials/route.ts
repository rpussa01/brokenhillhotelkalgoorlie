import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSpecialSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  price: z.number().finite().min(0),
  day: z.string().trim().max(60).nullable().optional(),
  badge: z.string().trim().max(60).nullable().optional(),
  imageUrl: z.string().trim().url().nullable().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();
    const parsed = createSpecialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please check the chef special details.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const special = await prisma.special.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        price: parsed.data.price,
        day: parsed.data.day ?? null,
        badge: parsed.data.badge ?? "CHEF SPECIAL",
        imageUrl: parsed.data.imageUrl ?? null,
        active: parsed.data.active,
        sortOrder: parsed.data.sortOrder,
      },
    });

    return NextResponse.json(special, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/specials:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create chef special.",
      },
      { status: 500 },
    );
  }
}