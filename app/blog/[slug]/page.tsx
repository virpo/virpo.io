import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { compilePostMdx } from "../../../components/blog/mdx-components";
import { SiteShell } from "../../../components/site/SiteShell";
import { getPost, getPostSlugs, type PostSource } from "../../../lib/blog";

const SITE_URL = "https://virpo.io";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = getPost(slug);
    const canonical = `/blog/${post.slug}/`;
    const images = post.socialImage ? [{ url: post.socialImage, alt: post.title }] : undefined;

    return {
      title: post.title,
      description: post.description,
      alternates: { canonical },
      openGraph: {
        type: "article",
        title: post.title,
        description: post.description,
        url: canonical,
        publishedTime: post.publishedAt.toISOString(),
        modifiedTime: post.updatedAt?.toISOString(),
        tags: post.tags,
        images,
      },
      twitter: {
        card: post.socialImage ? "summary_large_image" : "summary",
        title: post.title,
        description: post.description,
        images: post.socialImage ? [post.socialImage] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export function serializeArticleJsonLd(
  post: Pick<
    PostSource,
    | "slug"
    | "title"
    | "description"
    | "publishedAt"
    | "updatedAt"
    | "socialImage"
  >,
) {
  const canonical = `${SITE_URL}/blog/${post.slug}/`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt.toISOString(),
    dateModified: (post.updatedAt ?? post.publishedAt).toISOString(),
    mainEntityOfPage: canonical,
    url: canonical,
    author: {
      "@type": "Person",
      name: "Peter Hraska",
      url: SITE_URL,
    },
    image: post.socialImage ? new URL(post.socialImage, SITE_URL).toString() : undefined,
  };

  return JSON.stringify(structuredData).replace(/</g, "\\u003c");
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  let post;

  try {
    post = getPost(slug);
  } catch {
    notFound();
  }

  const { content } = await compilePostMdx(post.source);

  return (
    <SiteShell current="blog">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeArticleJsonLd(post),
        }}
      />
      <ArticleLayout post={post}>{content}</ArticleLayout>
    </SiteShell>
  );
}
