import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ message: "Missing file" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = (file as any).name?.split(".").pop() || "bin";
    const name = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
    const outDir = join(process.cwd(), "public", "uploads");
    const outPath = join(outDir, name);

    await writeFile(outPath, buffer);

    return NextResponse.json({
      url: `/uploads/${name}`,
      name,
      size: buffer.length,
      type: file.type,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to upload file",
      },
      { status: 400 },
    );
  }
}


