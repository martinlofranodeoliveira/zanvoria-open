import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature, checkAssetFallback, checkAssetFallbackBatch } from "../js/community/wildbound_asset_fallback_guard.mjs";

describe("wildbound asset fallback guard", () => {
  it("allows procedural-canvas", () => {
    const out = runFeature({ kind: "check-asset-fallback", value: { assetKind: "procedural-canvas" } });
    assert.deepEqual(out, {
      kind: "check-asset-fallback",
      ok: true,
      value: { allowed: true, assetKind: "procedural-canvas", issues: [], reason: null, valid: true }
    });
  });
  it("allows browser-sound", () => {
    const out = runFeature({ kind: "check-asset-fallback", value: { assetKind: "browser-sound" } });
    assert.equal(out.ok, true);
    assert.equal(out.value.allowed, true);
    assert.equal(out.value.reason, null);
    assert.equal(out.value.valid, true);
    assert.deepEqual(out.value.issues, []);
  });
  it("excludes well-formed image", () => {
    const out = runFeature({ kind: "check-asset-fallback", value: { assetKind: "image" } });
    assert.deepEqual(out, {
      kind: "check-asset-fallback",
      ok: true,
      value: { allowed: false, assetKind: "image", issues: [], reason: "excluded-asset", valid: true }
    });
  });
  it("excludes marketing material style kind", () => {
    const out = runFeature({ kind: "check-asset-fallback", value: { assetKind: "recorded-voice" } });
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.reason, "excluded-asset");
    assert.equal(out.value.valid, true);
  });
  it("rejects malformed non-string assetKind with null echo", () => {
    const out = runFeature({ kind: "check-asset-fallback", value: { assetKind: { x: 1 } } });
    assert.deepEqual(out, {
      kind: "check-asset-fallback",
      ok: true,
      value: { allowed: false, assetKind: null, issues: ["bad-asset-kind"], reason: null, valid: false }
    });
  });
  it("rejects malformed uppercase and empty kinds", () => {
    const a = runFeature({ kind: "check-asset-fallback", value: { assetKind: "Image" } });
    assert.equal(a.value.valid, false);
    assert.deepEqual(a.value.issues, ["bad-asset-kind"]);
    const b = runFeature({ kind: "check-asset-fallback", value: { assetKind: "" } });
    assert.equal(b.value.valid, false);
    const c = runFeature({ kind: "check-asset-fallback", value: { assetKind: "a_b" } });
    assert.equal(c.value.valid, false);
    assert.equal(c.value.assetKind, "a_b");
  });
  it("orders keys alphabetically", () => {
    const out = runFeature({ kind: "check-asset-fallback", value: { assetKind: "image" } });
    assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
    assert.deepEqual(Object.keys(out.value), ["allowed", "assetKind", "issues", "reason", "valid"]);
    const err = runFeature({ kind: "nope", value: {} });
    assert.deepEqual(Object.keys(err), ["issues", "kind", "ok", "value"]);
  });
  it("batch evaluates independently in order", () => {
    const out = runFeature({
      kind: "check-asset-fallback-batch",
      value: { requests: [{ assetKind: "procedural-canvas" }, { assetKind: "image" }, { assetKind: "BAD" }] }
    });
    assert.equal(out.ok, true);
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].allowed, true);
    assert.equal(out.value.results[1].reason, "excluded-asset");
    assert.equal(out.value.results[2].valid, false);
    assert.deepEqual(out.value.results[2].issues, ["bad-asset-kind"]);
    for (const r of out.value.results) {
      assert.deepEqual(Object.keys(r), ["allowed", "assetKind", "issues", "reason", "valid"]);
    }
  });
  it("batch empty succeeds", () => {
    const out = runFeature({ kind: "check-asset-fallback-batch", value: { requests: [] } });
    assert.deepEqual(out, { kind: "check-asset-fallback-batch", ok: true, value: { results: [] } });
  });
  it("unknown kind returns bad-kind", () => {
    const out = runFeature({ kind: "other", value: {} });
    assert.deepEqual(out, { issues: ["bad-kind"], kind: "unknown", ok: false, value: null });
  });
  it("non-object payload returns bad-payload", () => {
    assert.deepEqual(runFeature(null), { issues: ["bad-payload"], kind: "unknown", ok: false, value: null });
    assert.deepEqual(runFeature([]), { issues: ["bad-payload"], kind: "unknown", ok: false, value: null });
    assert.deepEqual(runFeature("x"), { issues: ["bad-payload"], kind: "unknown", ok: false, value: null });
  });
  it("malformed single value returns bad-value", () => {
    const out = runFeature({ kind: "check-asset-fallback", value: { wrong: "x" } });
    assert.deepEqual(out, { issues: ["bad-value"], kind: "check-asset-fallback", ok: false, value: null });
  });
  it("malformed batch value returns bad-requests", () => {
    const out = runFeature({ kind: "check-asset-fallback-batch", value: { requests: "no" } });
    assert.deepEqual(out.issues, ["bad-requests"]);
    assert.equal(out.ok, false);
    const out2 = runFeature({ kind: "check-asset-fallback-batch", value: { requests: [{ bad: 1 }] } });
    assert.deepEqual(out2.issues, ["bad-requests"]);
  });
  it("helpers are pure and preserve input", () => {
    const v = { assetKind: "procedural-canvas" };
    const snap = JSON.stringify(v);
    const r = checkAssetFallback(v);
    assert.equal(r.allowed, true);
    assert.equal(JSON.stringify(v), snap);
    const b = checkAssetFallbackBatch({ requests: [v] });
    assert.equal(b.results.length, 1);
    assert.equal(JSON.stringify(v), snap);
  });
});
