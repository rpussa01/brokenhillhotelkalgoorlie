import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const kitchenSettings = await prisma.kitchenSettings.upsert({
      where: {
        id: "main",
      },
      update: {},
      create: {
        id: "main",
        isOpen: true,
        closedTitle: "Kitchen currently closed",
        closedNote: "Online ordering is unavailable.",
      },
    });

    return NextResponse.json({
      isOpen: kitchenSettings.isOpen,
      closedTitle: kitchenSettings.closedTitle,
      closedNote: kitchenSettings.closedNote,
    });
  } catch (error) {
    console.error("Kitchen status GET error:", error);

    return NextResponse.json(
      {
        error: "Unable to read kitchen status",
      },
      {
        status: 500,
      }
    );
  }
}