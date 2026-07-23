import type { MetadataRoute } from "next";
import {
  getLatestPostDate,
  getPostSummaries,
  type PostSummary,
} from "../lib/blog";

const SITE_URL = "https://virpo.io";

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
      url: `${SITE_URL}/projects/`,
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
