import { NextResponse } from "next/server";
import { getModularConfig } from "@/lib/modular/config";

/**
 * GET /api/modular/config
 * Returns public-safe modular wallet configuration for client-side SDK initialization.
 * Client key is safe to expose as it's domain-locked by Circle.
 */
export async function GET() {
  try {
    const config = getModularConfig();

    return NextResponse.json({
      clientUrl: config.clientUrl,
      clientKey: config.clientKey,
      defaultChain: config.defaultChain,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load modular wallet config",
      },
      { status: 500 },
    );
  }
}

