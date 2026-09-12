import assert from "node:assert/strict";
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

test("server-renders the planner at the configured base path", async () => {
  const response = await render("/roamly-travel-planner");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="ko">/i);
  assert.match(html, /<title>Roamly — 여행 플래너<\/title>/i);
  assert.match(html, /상하이 3박 4일/);
  assert.match(html, /여행 홈/);
  assert.match(html, /예원/);
  assert.match(html, /\/roamly-travel-planner\/_next\/static\//);
});

test("the unprefixed root is not treated as the planner route", async () => {
  const response = await render("/");
  assert.equal(response.status, 404);
});
