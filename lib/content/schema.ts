import { z } from "zod";

const SITE_ORIGIN = "https://virpo.io";
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

function decodePathSegment(value: string) {
  let decoded = value;
  for (let pass = 0; pass < 4; pass += 1) {
    const next = decodeURIComponent(decoded);
    if (next === decoded) return decoded;
    decoded = next;
  }
  return decoded;
}

export function normalizeLocalMediaUrl(value: string): string | null {
  if (CONTROL_CHARACTERS.test(value) || !/^\/(?![\\/])/.test(value)) return null;

  try {
    for (const segment of value.split(/[?#]/, 1)[0].split("/")) {
      const decoded = decodePathSegment(segment);
      if (
        decoded === "." ||
        decoded === ".." ||
        decoded.includes("/") ||
        decoded.includes("\\")
      ) {
        return null;
      }
    }
    const resolved = new URL(value, SITE_ORIGIN);
    if (resolved.origin !== SITE_ORIGIN || !/^\/(?!\/)/.test(resolved.pathname)) {
      return null;
    }
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return null;
  }
}

export function isLocalMediaUrl(value: string): boolean {
  return normalizeLocalMediaUrl(value) !== null;
}

export const postFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(30).max(180),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  tags: z.array(z.string().min(1)).min(1),
  socialImage: z
    .string()
    .refine(isLocalMediaUrl, "Expected a root-relative local image path")
    .optional(),
  draft: z.boolean().default(false),
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export function parseFrontmatter(value: unknown): PostFrontmatter {
  return postFrontmatterSchema.parse(value);
}
