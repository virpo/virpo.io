import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { validateStaticReferences } from "../../scripts/validate-static-references.mjs";

const temporaryDirectories: string[] = [];

async function makeDist() {
  const directory = await mkdtemp(join(tmpdir(), "virpo-static-"));
  temporaryDirectories.push(directory);
  await mkdir(join(directory, "blog", "example"), { recursive: true });
  await mkdir(join(directory, "assets", "blog"), { recursive: true });
  await writeFile(join(directory, "index.html"), "<main>Home</main>");
  await writeFile(join(directory, "blog", "index.html"), "<main>Blog</main>");
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("static same-origin references", () => {
  it("accepts valid files and route links after stripping query and hash", async () => {
    const directory = await makeDist();
    await writeFile(join(directory, "assets", "blog", "present.png"), "png");
    await writeFile(join(directory, "assets", "blog", "poster.png"), "png");
    await writeFile(
      join(directory, "blog", "example", "index.html"),
      `<main>
        <a href="/blog/?view=all#posts">Blog</a>
        <img src="/assets/blog/present.png?width=900#image" alt="">
        <video poster="/assets/blog/poster.png"></video>
        <a href="https://example.com/external">External</a>
      </main>`,
    );

    await expect(validateStaticReferences(directory)).resolves.toEqual({
      htmlFiles: 3,
      references: 3,
    });
  });

  it("fails when an exported article references a missing image", async () => {
    const directory = await makeDist();
    await writeFile(
      join(directory, "blog", "example", "index.html"),
      '<img src="/assets/blog/missing.png" alt="">',
    );

    await expect(validateStaticReferences(directory)).rejects.toThrow(
      /blog\/example\/index\.html.*missing\.png/i,
    );
  });

  it("rejects encoded traversal instead of resolving outside the declared path", async () => {
    const directory = await makeDist();
    await writeFile(
      join(directory, "blog", "example", "index.html"),
      '<img src="/assets/blog/%2e%2e/private.png" alt="">',
    );

    await expect(validateStaticReferences(directory)).rejects.toThrow(
      /unsafe.*%2e%2e/i,
    );
  });
});
