import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const placeholder = "__ROAMLY_GOOGLE_MAPS_API_KEY__";
const sourcePath = resolve("public/roamly-travel-planner.html");
const outputPath = resolve(".vercel/output/static/roamly-travel-planner.html");
const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();

if (!apiKey) {
  if (process.env.VERCEL === "1") {
    throw new Error("Missing required Vercel environment variable: GOOGLE_MAPS_API_KEY");
  }

  console.warn("GOOGLE_MAPS_API_KEY is not set; leaving the standalone HTML placeholder unchanged.");
  process.exit(0);
}

const html = await readFile(sourcePath, "utf8");
if (!html.includes(placeholder)) {
  throw new Error(`Google Maps placeholder not found in ${sourcePath}`);
}

await writeFile(outputPath, html.replaceAll(placeholder, apiKey));
console.log("Injected GOOGLE_MAPS_API_KEY into the Vercel standalone HTML asset.");
