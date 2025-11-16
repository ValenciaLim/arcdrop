import { nanoid } from "nanoid";
import { prisma } from "./prisma";
import { sanitizeHandle } from "./utils";

export async function generateLinkSlug(handle: string) {
  const base = sanitizeHandle(handle);
  const slug = `${base}-${nanoid(6).toLowerCase()}`;

  const existing = await prisma.paymentLink.findUnique({
    where: { slug },
  });

  if (!existing) return slug;
  return generateLinkSlug(handle);
}

