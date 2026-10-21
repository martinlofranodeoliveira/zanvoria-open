import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_preview_route_guard.mjs";

const TEN = ["allowed", "blockedReason", "cache", "isSymlink", "issues", "method", "status", "target", "traversesSymlink", "valid"];

function req(method, target, isSymlink = false, traversesSymlink = false) {
  return { kind: "check-preview-route", value: { isSymlink, method, target, traversesSymlink } };
}

describe("wildbound preview route guard", () => {
  it("allows GET under js with no-store", () => {
    const out = runFeature(req("GET", "/js/game.js"));
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-preview-route");
    assert.deepEqual(Object.keys(out.value), TEN);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.allowed, true);
    assert.equal(out.value.status, 200);
    assert.equal(out.value.cache, "no-store");
    assert.equal(out.value.blockedReason, null);
    assert.deepEqual(out.value.issues, []);
    assert.equal(out.value.method, "GET");
    assert.equal(out.value.target, "/js/game.js");
  });
  it("allows HEAD root index and css", () => {
    for (const t of ["/", "/index.html", "/css/site.css", "/js/a.js"]) {
      const out = runFeature(req("HEAD", t));
      assert.equal(out.value.allowed, true);
      assert.equal(out.value.status, 200);
      assert.equal(out.value.cache, "no-store");
    }
  });
  it("denies POST with 405", () => {
    const out = runFeature(req("POST", "/index.html"));
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.status, 405);
    assert.equal(out.value.cache, null);
    assert.equal(out.value.blockedReason, "method-not-allowed");
  });
  it("method priority beats symlink", () => {
    const out = runFeature(req("POST", "/js/a.js", true, false));
    assert.equal(out.value.status, 405);
    assert.equal(out.value.blockedReason, "method-not-allowed");
  });
  it("denies symlink and traversal flags", () => {
    const a = runFeature(req("GET", "/js/a.js", true, false));
    assert.equal(a.value.blockedReason, "symlink-denied");
    assert.equal(a.value.status, 404);
    const b = runFeature(req("GET", "/js/a.js", false, true));
    assert.equal(b.value.blockedReason, "symlink-denied");
  });
  it("denies dotfile segments", () => {
    const out = runFeature(req("GET", "/js/.hidden"));
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.status, 404);
    assert.equal(out.value.blockedReason, "dotfile-denied");
  });
  it("denies traversal segments", () => {
    const out = runFeature(req("GET", "/js/../css/a.css"));
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.status, 404);
    assert.equal(out.value.blockedReason, "traversal-denied");
  });
  it("denies outside roots with not-found", () => {
    const out = runFeature(req("GET", "/other/x"));
    assert.equal(out.value.blockedReason, "not-found");
    assert.equal(out.value.status, 404);
    assert.equal(out.value.cache, null);
  });
  it("reports malformed fields with ordered issues", () => {
    const out = runFeature({ kind: "check-preview-route", value: { isSymlink: "x", method: "get", target: "no-slash", traversesSymlink: 1 } });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.status, null);
    assert.equal(out.value.cache, null);
    assert.equal(out.value.blockedReason, null);
    assert.deepEqual(out.value.issues, ["bad-method", "bad-target", "bad-symlink-flag", "bad-traversal-flag"]);
    assert.deepEqual(Object.keys(out.value), TEN);
  });
  it("nulls mistyped echoes singly", () => {
    const out = runFeature({ kind: "check-preview-route", value: { isSymlink: false, method: "GET", target: { x: 1 }, traversesSymlink: false } });
    assert.deepEqual(out.value.issues, ["bad-target"]);
    assert.equal(out.value.target, null);
    assert.equal(out.value.method, "GET");
  });
  it("batch evaluates independently in order", () => {
    const out = runFeature({ kind: "check-preview-route-batch", value: { requests: [{ isSymlink: false, method: "GET", target: "/js/a.js", traversesSymlink: false }, { isSymlink: false, method: "POST", target: "/index.html", traversesSymlink: false }, { isSymlink: false, method: "get", target: "/js/a.js", traversesSymlink: false }] } });
    assert.equal(out.ok, true);
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].status, 200);
    assert.equal(out.value.results[1].blockedReason, "method-not-allowed");
    assert.equal(out.value.results[2].valid, false);
    for (const r of out.value.results) {
      assert.deepEqual(Object.keys(r), TEN);
    }
  });
  it("batch empty ok", () => {
    const out = runFeature({ kind: "check-preview-route-batch", value: { requests: [] } });
    assert.equal(out.ok, true);
    assert.deepEqual(out.value.results, []);
  });
  it("unknown kind and payload errors", () => {
    const a = runFeature({ kind: "nope", value: {} });
    assert.equal(a.ok, false);
    assert.equal(a.kind, "unknown");
    assert.equal(a.value, null);
    assert.deepEqual(a.issues, ["bad-kind"]);
    const b = runFeature(null);
    assert.deepEqual(b.issues, ["bad-payload"]);
    const c = runFeature({ kind: "check-preview-route", value: { method: "GET" } });
    assert.deepEqual(c.issues, ["bad-value"]);
    const d = runFeature({ kind: "check-preview-route-batch", value: { requests: "x" } });
    assert.deepEqual(d.issues, ["bad-requests"]);
  });
  it("preserves input and stays deterministic", () => {
    const p = req("GET", "/js/game.js");
    const before = JSON.stringify(p);
    const a = runFeature(p);
    const b = runFeature(JSON.parse(before));
    assert.deepEqual(a, b);
    assert.equal(JSON.stringify(p), before);
    assert.deepEqual(Object.keys(a).sort(), Object.keys(a));
  });
});
