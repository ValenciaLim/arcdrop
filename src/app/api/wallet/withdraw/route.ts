import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const walletAddress: string | undefined = body?.walletAddress;
    const amount: number | undefined = body?.amount;
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ message: "Invalid walletAddress" }, { status: 400 });
    }
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }
    // Mock withdraw; integrate with Arc/Circle payout in real flow
    return NextResponse.json({ success: true, txId: "mock-tx" });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to withdraw",
      },
      { status: 500 },
    );
  }
}


