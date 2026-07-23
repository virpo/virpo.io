import { z } from "zod";

export const postFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(30).max(180),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  tags: z.array(z.string().min(1)).min(1),
  socialImage: z
    .string()
    .regex(/^\/(?!\/)/, "Expected a root-relative local image path")
    .optional(),
  draft: z.boolean().default(false),
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export function parseFrontmatter(value: unknown): PostFrontmatter {
  return postFrontmatterSchema.parse(value);
}
