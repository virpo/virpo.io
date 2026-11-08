import type { MetadataRoute } from "next";
import {
  getLatestPostDate,
  getPostSummaries,
  type PostSummary,
} from "../lib/blog";

const SITE_URL = "https://virpo.io";
// pages not driven by posts: bump these when the page changes
const SKILLS_UPDATED = new Date("2026-10-15");
const LEVELS_UPDATED = new Date("2026-10-25");

export const dynamic = "force-static";

export function buildSitemap(posts: PostSummary[]): MetadataRoute.Sitemap {
  const latestPostDate = getLatestPostDate(posts);

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: latestPostDate,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog/`,
      lastModified: latestPostDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/skills/`,
      lastModified: SKILLS_UPDATED,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/levels/`,
      lastModified: LEVELS_UPDATED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}/`,
      lastModified: post.updatedAt ?? post.publishedAt,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(getPostSummaries());
}
