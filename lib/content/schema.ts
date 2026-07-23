import { z } from "zod";

const SITE_ORIGIN = "https://virpo.io";
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

export function isLocalMediaUrl(value: string): boolean {
  if (CONTROL_CHARACTERS.test(value) || !/^\/(?![\\/])/.test(value)) return false;

  try {
    const resolved = new URL(value, SITE_ORIGIN);
    return resolved.origin === SITE_ORIGIN && /^\/(?!\/)/.test(resolved.pathname);
  } catch {
    return false;
  }
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
