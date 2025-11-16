import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCreatorSchema } from "@/lib/validators";
import { sanitizeHandle } from "@/lib/utils";
import { getOrCreateUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { message: "Email parameter is required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { creatorProfile: true },
    });

    if (!user || !user.creatorProfile) {
      return NextResponse.json({ creator: null }, { status: 200 });
    }

    return NextResponse.json({ creator: user.creatorProfile }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to check creator",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = createCreatorSchema.parse(payload);

    const user = await getOrCreateUser(data.email);
    const handle = sanitizeHandle(data.handle);

    const existing = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ userId: user.id }, { handle }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { creator: existing, message: "Creator already exists" },
        { status: 200 },
      );
    }

    const creator = await prisma.creatorProfile.create({
      data: {
        userId: user.id,
        handle,
        displayName: data.displayName,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
      },
    });

    return NextResponse.json({ creator });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to create creator",
      },
      { status: 400 },
    );
  }
}

