import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ArticlePage, {
  generateMetadata,
  generateStaticParams,
} from "../../app/blog/[slug]/page";
import { compilePostMdx } from "../../components/blog/mdx-components";
import { getPost } from "../../lib/content/posts";

const globals = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

describe("article media", () => {
  it("renders standalone figures outside paragraphs", async () => {
    const { content } = await compilePostMdx(
      getPost("a-different-kind-of-hackathon").source,
    );
    const html = renderToStaticMarkup(content);

    expect(html).toContain('<figure class="articleMedia">');
    expect(html).not.toMatch(/<p>\s*<figure/);
    expect(html).not.toMatch(/<\/figure>\s*<\/p>/);
    expect(html).not.toContain("<p></p>");
  });

  it("does not crop paired images to a forced aspect ratio", async () => {
    const { content } = await compilePostMdx(getPost("weird-use-of-ai-1").source);
    const html = renderToStaticMarkup(content);
    const pairImageRule = globals.match(/\.articleImagePairItem img\s*{([^}]*)}/)?.[1] ?? "";

    expect(html).toContain('width="1200" height="1600"');
    expect(html).toContain('width="1000" height="1283"');
    expect(pairImageRule).not.toMatch(/aspect-ratio|object-fit/);
  });
});

describe("trusted repository MDX boundary", () => {
  it.each([
    ["imports", 'import Widget from "./Widget"\n\nCopy.'],
    ["exports", "export const secret = 42\n\nCopy."],
    ["unapproved JSX", "<Aside>Copy.</Aside>"],
    ["free expressions", "The total is {1 + 1}."],
    [
      "unapproved component attributes",
      '<ArticleImage src="/assets/blog/ai-build-day.png" alt="Group" onClick={() => alert(1)} />',
    ],
    [
      "non-literal ImagePair descriptors",
      `<ImagePair
  left={{ src: "/assets/blog/pegboard-sketch.jpg", alt: "Sketch" + "!" }}
  right={{ src: "/assets/blog/pegboard-finished.jpg", alt: "Finished" }}
/>`,
    ],
    ["uncontrolled Markdown images", "![Group](/assets/blog/ai-build-day.png)"],
  ])("rejects %s before compilation", async (_label, source) => {
    await expect(compilePostMdx(source)).rejects.toThrow(/not allowed/i);
  });
});

describe("article route SEO", () => {
  it("generates every article and complete social metadata", async () => {
    expect(generateStaticParams().map(({ slug }) => slug)).toEqual([
      "weird-use-of-ai-3",
      "weird-use-of-ai-1",
      "a-different-kind-of-hackathon",
    ]);

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "weird-use-of-ai-1" }),
    });
    expect(metadata).toMatchObject({
      title: "Weird use of AI #1: A toy for my son",
      alternates: { canonical: "/blog/weird-use-of-ai-1/" },
      openGraph: {
        type: "article",
        url: "/blog/weird-use-of-ai-1/",
        images: [
          {
            url: "/assets/blog/pegboard-finished.jpg",
            alt: "Weird use of AI #1: A toy for my son",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        images: ["/assets/blog/pegboard-finished.jpg"],
      },
    });
  });

  it("renders escaped Article JSON-LD into the static article tree", async () => {
    const route = await ArticlePage({
      params: Promise.resolve({ slug: "a-different-kind-of-hackathon" }),
    });
    const html = renderToStaticMarkup(route);

    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type":"Article"');
    expect(html).toContain(
      '"mainEntityOfPage":"https://virpo.io/blog/a-different-kind-of-hackathon/"',
    );
    expect(html).not.toContain("<p><figure");
  });
});
