import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the planner at the named route", async () => {
  for (const pathname of ["/roamly-travel-planner"]) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

    const html = await response.text();
    assert.match(html, /<html lang="ko">/i);
    assert.match(html, /<title>Roamly — 여행 플래너<\/title>/i);
    assert.match(html, /상하이 3박 4일/);
    assert.match(html, /여행 홈/);
    assert.match(html, /예원/);
    assert.match(html, /\/_next\/static\//);
  }
});

test("includes the standalone planner HTML for the Vercel root rewrite", async () => {
  const html = await readFile(
    new URL("../public/roamly-travel-planner.html", import.meta.url),
    "utf8",
  );

  assert.match(html, /<html lang="ko">/i);
  assert.match(html, /<title>Roamly · 내 여행<\/title>/i);
  assert.match(html, /id="app"/i);
  assert.match(html, /__ROAMLY_GOOGLE_MAPS_API_KEY__/);
  assert.doesNotMatch(html, /AIzaSy[A-Za-z0-9_-]+/);
});
