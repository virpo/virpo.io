import { access } from "node:fs/promises";
import { resolve } from "node:path";

const indexPath = resolve("dist", "index.html");

try {
  await access(indexPath);
} catch {
  throw new Error(`Expected static export at ${indexPath}`);
}
