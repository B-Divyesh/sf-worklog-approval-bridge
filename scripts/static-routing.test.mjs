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
