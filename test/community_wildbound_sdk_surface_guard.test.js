import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_sdk_surface_guard.mjs";
const expectedValueKeys = ["ad", "canAdvertise", "canLifecycle", "canPersist", "canRank", "data", "game", "init", "issues", "user", "valid"];
describe("wildbound sdk surface guard", () => {
  it("well-formed all true echoes with conjunctions", () => {
    const out = runFeature({ kind: "check-sdk-surface", value: { ad: true, data: true, game: true, init: true, user: true } });
    assert.deepEqual(out, { kind: "check-sdk-surface", ok: true, value: { ad: true, canAdvertise: true, canLifecycle: true, canPersist: true, canRank: true, data: true, game: true, init: true, issues: [], user: true, valid: true } });
    assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
    assert.deepEqual(Object.keys(out.value), expectedValueKeys);
  });
  it("well-formed init false yields false capabilities", () => {
    const out = runFeature({ kind: "check-sdk-surface", value: { ad: true, data: true, game: true, init: false, user: true } });
    assert.deepEqual(out, { kind: "check-sdk-surface", ok: true, value: { ad: true, canAdvertise: false, canLifecycle: false, canPersist: false, canRank: false, data: true, game: true, init: false, issues: [], user: true, valid: true } });
  });
  it("single malformed flag returns valid false with nulls", () => {
    const out = runFeature({ kind: "check-sdk-surface", value: { ad: "yes", data: true, game: true, init: true, user: true } });
    assert.deepEqual(out, { kind: "check-sdk-surface", ok: true, value: { ad: null, canAdvertise: null, canLifecycle: null, canPersist: null, canRank: null, data: true, game: true, init: true, issues: ["bad-ad-flag"], user: true, valid: false } });
  });
  it("multiple malformed flags list issues in deterministic order", () => {
    const out = runFeature({ kind: "check-sdk-surface", value: { ad: 1, data: "x", game: null, init: {}, user: 0 } });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, false);
    assert.deepEqual(out.value.issues, ["bad-ad-flag", "bad-data-flag", "bad-game-flag", "bad-init-flag", "bad-user-flag"]);
    assert.equal(out.value.ad, null);
    assert.equal(out.value.canLifecycle, null);
    assert.equal(out.value.canPersist, null);
    assert.equal(out.value.canAdvertise, null);
    assert.equal(out.value.canRank, null);
    assert.deepEqual(Object.keys(out.value), expectedValueKeys);
  });
  it("mixed booleans echo else null", () => {
    const out = runFeature({ kind: "check-sdk-surface", value: { ad: true, data: 1, game: false, init: "y", user: false } });
    assert.equal(out.value.ad, true);
    assert.equal(out.value.data, null);
    assert.equal(out.value.game, false);
    assert.equal(out.value.init, null);
    assert.equal(out.value.user, false);
    assert.deepEqual(out.value.issues, ["bad-data-flag", "bad-init-flag"]);
    assert.equal(out.value.valid, false);
  });
  it("batch evaluates independently in order", () => {
    const out = runFeature({ kind: "check-sdk-surface-batch", value: { requests: [{ ad: true, data: true, game: true, init: true, user: true }, { ad: true, data: true, game: true, init: false, user: true }, { ad: "bad", data: true, game: true, init: true, user: true }] } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-sdk-surface-batch");
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].valid, true);
    assert.equal(out.value.results[0].canLifecycle, true);
    assert.equal(out.value.results[1].valid, true);
    assert.equal(out.value.results[1].canLifecycle, false);
    assert.equal(out.value.results[2].valid, false);
    assert.deepEqual(out.value.results[2].issues, ["bad-ad-flag"]);
    assert.equal(out.value.results[2].ad, null);
    for (const r of out.value.results) {
      assert.deepEqual(Object.keys(r), expectedValueKeys);
    }
  });
  it("batch empty returns empty results", () => {
    const out = runFeature({ kind: "check-sdk-surface-batch", value: { requests: [] } });
    assert.deepEqual(out, { kind: "check-sdk-surface-batch", ok: true, value: { results: [] } });
  });
  it("invalid kind and payload shapes return ok false with single reason", () => {
    assert.deepEqual(runFeature(null), { issues: ["bad-payload"], kind: "unknown", ok: false, value: null });
    assert.deepEqual(runFeature([]), { issues: ["bad-payload"], kind: "unknown", ok: false, value: null });
    assert.deepEqual(runFeature({ kind: "nope", value: {} }), { issues: ["bad-kind"], kind: "unknown", ok: false, value: null });
    assert.deepEqual(runFeature({ value: {} }), { issues: ["bad-kind"], kind: "unknown", ok: false, value: null });
    assert.deepEqual(runFeature({ kind: "check-sdk-surface", value: { ad: true } }), { issues: ["bad-value"], kind: "check-sdk-surface", ok: false, value: null });
    assert.deepEqual(runFeature({ kind: "check-sdk-surface", value: { ad: true, data: true, game: true, init: true, user: true, extra: 1 } }), { issues: ["bad-value"], kind: "check-sdk-surface", ok: false, value: null });
    assert.deepEqual(runFeature({ kind: "check-sdk-surface-batch", value: { requests: "x" } }), { issues: ["bad-requests"], kind: "check-sdk-surface-batch", ok: false, value: null });
    assert.deepEqual(runFeature({ kind: "check-sdk-surface-batch", value: { requests: [{ ad: true }] } }), { issues: ["bad-requests"], kind: "check-sdk-surface-batch", ok: false, value: null });
  });
  it("top-level keys ordered alphabetically", () => {
    const e = runFeature({ kind: "bad", value: null });
    assert.deepEqual(Object.keys(e), ["issues", "kind", "ok", "value"]);
    const s = runFeature({ kind: "check-sdk-surface", value: { ad: false, data: false, game: false, init: false, user: false } });
    assert.deepEqual(Object.keys(s), ["kind", "ok", "value"]);
  });
  it("preserves input and is deterministic", () => {
    const input = { kind: "check-sdk-surface", value: { ad: true, data: false, game: true, init: true, user: false } };
    const snapshot = JSON.parse(JSON.stringify(input));
    const a = runFeature(input);
    const b = runFeature(input);
    assert.deepEqual(input, snapshot);
    assert.deepEqual(a, b);
    assert.equal(a.value.canLifecycle, true);
    assert.equal(a.value.canPersist, false);
    assert.equal(a.value.canAdvertise, true);
    assert.equal(a.value.canRank, false);
  });
});
