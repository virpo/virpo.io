import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const dist = resolve("dist");
const html = await readFile(resolve(dist, "index.html"), "utf8");
const maximumInitialBytes = 1_000_000;
const assetExtensions = new Set([
  ".css",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".png",
  ".svg",
  ".webp",
  ".woff2",
]);

if (html.includes("youtube-nocookie.com")) {
  throw new Error("YouTube must not be present in the initial homepage HTML");
}

const urls = new Set(
  [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1].split(/[?#]/, 1)[0])
    .filter((url) => url.startsWith("/") && assetExtensions.has(extname(url))),
);

for (const url of [
  "/assets/optimized/radio.webp",
  "/assets/optimized/study-paper.webp",
  "/assets/optimized/train-window.webp",
  "/assets/optimized/train-window-still.webp",
]) {
  urls.add(url);
}

const compressibleExtensions = new Set([".css", ".html", ".js", ".svg"]);
const resources = [
  {
    url: "/index.html",
    bytes: gzipSync(Buffer.from(html), { level: 9 }).byteLength,
  },
];
for (const url of [...urls].sort()) {
  const path = resolve(dist, url.slice(1));
  const extension = extname(path);
  const bytes = compressibleExtensions.has(extension)
    ? gzipSync(await readFile(path), { level: 9 }).byteLength
    : (await stat(path)).size;
  resources.push({ url, bytes });
}

const totalBytes = resources.reduce((total, resource) => total + resource.bytes, 0);
if (totalBytes > maximumInitialBytes) {
  const detail = resources
    .sort((left, right) => right.bytes - left.bytes)
    .map(({ url, bytes }) => `${bytes.toLocaleString().padStart(9)}  ${url}`)
    .join("\n");
  throw new Error(
    `Homepage initial asset budget exceeded: ${totalBytes.toLocaleString()} > ${maximumInitialBytes.toLocaleString()} bytes\n${detail}`,
  );
}

console.log(
  `Homepage initial transfer budget: ${totalBytes.toLocaleString()} / ${maximumInitialBytes.toLocaleString()} bytes across ${resources.length} resources`,
);
