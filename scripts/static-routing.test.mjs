import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const config = JSON.parse(await readFile(new URL("../public/staticwebapp.config.json", import.meta.url), "utf8"));

test("@regression:static-routing serves only real SPA routes and preserves a genuine 404", () => {
  assert.equal("navigationFallback" in config, false, "an SPA catch-all turns unknown live URLs into 200 responses");
  assert.deepEqual(config.responseOverrides?.["404"], { rewrite: "/404.html", statusCode: 404 });
  const rewrites = new Map(config.routes.filter(route => route.rewrite).map(route => [route.route, route.rewrite]));
  for (const route of ["/demo", "/app", "/privacy", "/terms", "/download", "/approve"]) {
    assert.equal(rewrites.get(route), "/index.html", `${route} must remain reloadable`);
  }
});

test("@regression:verification-11-sitemap-lists-every-public-route-but-not-private-approval-links", async () => {
  const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  const listedPaths = [...sitemap.matchAll(/<loc>https:\/\/worklog-approval-bridge\.sociobot\.in([^<]+)<\/loc>/g)]
    .map(([, path]) => path);
  assert.deepEqual(listedPaths, ["/", "/demo", "/app", "/privacy", "/terms", "/download"]);
  assert.equal(listedPaths.includes("/approve"), false, "approval packets are private fragment URLs and must not be indexed");
});
