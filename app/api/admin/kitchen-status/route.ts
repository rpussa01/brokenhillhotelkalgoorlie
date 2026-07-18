import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type KitchenStatusBody = {
  isOpen?: boolean;
  closedTitle?: string;
  closedNote?: string;
};

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const settings = await prisma.kitchenSettings.upsert({
      where: {
        id: "main",
      },
      update: {},
      create: {
        id: "main",
        isOpen: true,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET kitchen status failed:", error);

    return NextResponse.json(
      { error: "Could not load kitchen status." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  let body: KitchenStatusBody;

  try {
    body = (await request.json()) as KitchenStatusBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON." },
      { status: 400 },
    );
  }

  if (typeof body.isOpen !== "boolean") {
    return NextResponse.json(
      { error: "isOpen must be true or false." },
      { status: 400 },
    );
  }

  try {
    const settings = await prisma.kitchenSettings.upsert({
      where: {
        id: "main",
      },
      update: {
        isOpen: body.isOpen,

        ...(body.closedTitle !== undefined
          ? {
              closedTitle:
                body.closedTitle.trim() ||
                "Kitchen currently closed",
            }
          : {}),

        ...(body.closedNote !== undefined
          ? {
              closedNote:
                body.closedNote.trim() ||
                "Online ordering is unavailable right now. Please check again later.",
            }
          : {}),
      },
      create: {
        id: "main",
        isOpen: body.isOpen,
        closedTitle:
          body.closedTitle?.trim() ||
          "Kitchen currently closed",
        closedNote:
          body.closedNote?.trim() ||
          "Online ordering is unavailable right now. Please check again later.",
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("PATCH kitchen status failed:", error);

    return NextResponse.json(
      { error: "Could not update kitchen status." },
      { status: 500 },
    );
  }
}