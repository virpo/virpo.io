import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const factUtilsPath = path.join(root, "fact-utils.js");
const dataPath = path.join(root, "data", "today-facts.json");

const factUtilsCode = fs.readFileSync(factUtilsPath, "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(factUtilsCode, sandbox);

const { buildFactHeadline, buildFactLane } = sandbox.window.factUtils;
const records = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const enriched = records.map((record) => ({
  ...record,
  displayHeadline: buildFactHeadline(record),
  displayLane: buildFactLane(record),
}));

fs.writeFileSync(dataPath, `${JSON.stringify(enriched, null, 2)}\n`);
console.log(`Enriched ${enriched.length} fact records in ${dataPath}`);
