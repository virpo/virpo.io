import { readdir, readFile, stat } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

const DEFAULT_ORIGIN = "https://virpo.io";
const REFERENCE_PATTERN = /\b(?:src|href|poster)\s*=\s*(["'])(.*?)\1/gi;

async function findHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return findHtmlFiles(path);
      return entry.isFile() && entry.name.endsWith(".html") ? [path] : [];
    }),
  );
  return nested.flat();
}

function htmlRoute(file, distDirectory) {
  const path = relative(distDirectory, file).split(sep).join("/");
  if (path === "index.html") return "/";
  if (path.endsWith("/index.html")) return `/${path.slice(0, -10)}`;
  return `/${path}`;
}

function repeatedDecode(value) {
  let decoded = value;
  for (let pass = 0; pass < 4; pass += 1) {
    const next = decodeURIComponent(decoded);
    if (next === decoded) return decoded;
    decoded = next;
  }
  return decoded;
}

function referencePath(reference) {
  if (/^https?:\/\//i.test(reference)) {
    return reference.match(/^https?:\/\/[^/]+([^?#]*)/i)?.[1] ?? "/";
  }
  if (reference.startsWith("//")) {
    return reference.match(/^\/\/[^/]+([^?#]*)/)?.[1] ?? "/";
  }
  return reference.split(/[?#]/, 1)[0];
}

function assertSafeReference(reference, file) {
  const path = referencePath(reference);
  for (const segment of path.split("/")) {
    let decoded;
    try {
      decoded = repeatedDecode(segment);
    } catch {
      throw new Error(`Unsafe static reference in ${file}: ${reference}`);
    }
    if (
      decoded === "." ||
      decoded === ".." ||
      decoded.includes("/") ||
      decoded.includes("\\")
    ) {
      throw new Error(`Unsafe static reference in ${file}: ${reference}`);
    }
  }
}

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function resolveOutputReference(pathname, distDirectory) {
  const decodedPath = decodeURIComponent(pathname);
  const target = resolve(distDirectory, `.${decodedPath}`);
  const root = `${resolve(distDirectory)}${sep}`;
  if (target !== resolve(distDirectory) && !target.startsWith(root)) return null;

  const hasExtension = /\/[^/]+\.[^/]+$/.test(decodedPath);
  const candidates =
    decodedPath.endsWith("/") || decodedPath === "/"
      ? [resolve(target, "index.html")]
      : hasExtension
        ? [target]
        : [resolve(target, "index.html"), `${target}.html`];

  for (const candidate of candidates) {
    if (await isFile(candidate)) return candidate;
  }
  return null;
}

export async function validateStaticReferences(
  distDirectory,
  siteOrigin = DEFAULT_ORIGIN,
) {
  const root = resolve(distDirectory);
  const origin = new URL(siteOrigin).origin;
  const htmlFiles = await findHtmlFiles(root);
  let references = 0;

  for (const file of htmlFiles) {
    const source = await readFile(file, "utf8");
    const route = htmlRoute(file, root);
    const documentUrl = new URL(route, origin);

    for (const match of source.matchAll(REFERENCE_PATTERN)) {
      const reference = match[2].replaceAll("&amp;", "&").trim();
      if (!reference || reference.startsWith("#")) continue;
      if (/^(?:mailto|tel|data|blob|javascript):/i.test(reference)) continue;

      assertSafeReference(reference, relative(root, file));
      const url = new URL(reference, documentUrl);
      if (url.origin !== origin) continue;

      references += 1;
      const output = await resolveOutputReference(url.pathname, root);
      if (!output) {
        throw new Error(
          `Missing static reference in ${relative(root, file)}: ${reference}`,
        );
      }
    }
  }

  return { htmlFiles: htmlFiles.length, references };
}
