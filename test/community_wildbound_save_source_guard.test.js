import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature, checkSaveSource, checkSaveSourceBatch } from "../js/community/wildbound_save_source_guard.mjs";
function keysOf(v) {
  return Object.keys(v);
}
function sortedCopy(names) {
  return [...names].sort();
}
describe("wildbound save source guard", () => {
  it("sdk available returns sdk source", () => {
    const out = runFeature({ kind: "check-save-source", value: { localValue: "{\"level\":1}", sdkAvailable: true, sdkValue: "{\"level\":2}" } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-save-source");
    assert.equal(out.value.valid, true);
    assert.deepEqual(out.value.issues, []);
    assert.equal(out.value.source, "sdk");
    assert.equal(out.value.resolved, "{\"level\":2}");
    assert.deepEqual(keysOf(out.value), ["issues", "localValue", "resolved", "sdkAvailable", "sdkValue", "source", "valid"]);
  });
  it("sdk unavailable falls back to local", () => {
    const out = runFeature({ kind: "check-save-source", value: { localValue: "{\"level\":1}", sdkAvailable: false, sdkValue: null } });
    assert.equal(out.value.source, "local");
    assert.equal(out.value.resolved, "{\"level\":1}");
    assert.equal(out.value.valid, true);
  });
  it("null sdk value falls back to local even when flag true", () => {
    const out = runFeature({ kind: "check-save-source", value: { localValue: "abc", sdkAvailable: true, sdkValue: null } });
    assert.equal(out.value.source, "local");
    assert.equal(out.value.resolved, "abc");
  });
  it("both null yields empty source", () => {
    const out = runFeature({ kind: "check-save-source", value: { localValue: null, sdkAvailable: false, sdkValue: null } });
    assert.equal(out.value.source, "empty");
    assert.equal(out.value.resolved, null);
    assert.equal(out.value.valid, true);
  });
  it("malformed local value returns deterministic issue", () => {
    const out = runFeature({ kind: "check-save-source", value: { localValue: 1, sdkAvailable: true, sdkValue: null } });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, false);
    assert.deepEqual(out.value.issues, ["bad-local-value"]);
    assert.equal(out.value.source, null);
    assert.equal(out.value.resolved, null);
    assert.equal(out.value.localValue, null);
  });
  it("malformed fields combine in deterministic order", () => {
    const out = runFeature({ kind: "check-save-source", value: { localValue: 7, sdkAvailable: "yes", sdkValue: 7 } });
    assert.deepEqual(out.value.issues, ["bad-sdk-flag", "bad-sdk-value", "bad-local-value"]);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.sdkAvailable, null);
  });
  it("control characters rejected except LF CR TAB", () => {
    const bad = runFeature({ kind: "check-save-source", value: { localValue: "a\u0000b", sdkAvailable: false, sdkValue: null } });
    assert.equal(bad.value.valid, false);
    const good = runFeature({ kind: "check-save-source", value: { localValue: "a\n\r\tb", sdkAvailable: false, sdkValue: null } });
    assert.equal(good.value.valid, true);
    assert.equal(good.value.source, "local");
  });
  it("batch evaluates in order with seven keys", () => {
    const out = runFeature({ kind: "check-save-source-batch", value: { requests: [{ localValue: "a", sdkAvailable: true, sdkValue: "b" }, { localValue: null, sdkAvailable: false, sdkValue: null }] } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-save-source-batch");
    assert.equal(out.value.results.length, 2);
    assert.equal(out.value.results[0].source, "sdk");
    assert.equal(out.value.results[1].source, "empty");
    for (const r of out.value.results) {
      assert.deepEqual(keysOf(r), ["issues", "localValue", "resolved", "sdkAvailable", "sdkValue", "source", "valid"]);
    }
  });
  it("batch empty and helpers work", () => {
    const out = runFeature({ kind: "check-save-source-batch", value: { requests: [] } });
    assert.deepEqual(out.value.results, []);
    const one = checkSaveSource({ localValue: null, sdkAvailable: true, sdkValue: "x" });
    assert.equal(one.source, "sdk");
    const many = checkSaveSourceBatch([{ localValue: null, sdkAvailable: false, sdkValue: null }]);
    assert.equal(many.length, 1);
  });
  it("top level errors use unknown fallback and single reason", () => {
    assert.deepEqual(runFeature(null), { issues: ["bad-payload"], kind: "unknown", ok: false, value: null });
    assert.deepEqual(runFeature({ kind: "nope", value: null }), { issues: ["bad-kind"], kind: "unknown", ok: false, value: null });
    assert.deepEqual(runFeature({ kind: "check-save-source", value: {} }), { issues: ["bad-value"], kind: "check-save-source", ok: false, value: null });
    const many = [];
    for (let i = 0; i < 17; i++) {
      many.push({ localValue: null, sdkAvailable: false, sdkValue: null });
    }
    assert.deepEqual(runFeature({ kind: "check-save-source-batch", value: { requests: many } }).issues, ["bad-requests"]);
    assert.deepEqual(runFeature({ kind: "check-save-source-batch", value: { requests: "x" } }).issues, ["bad-requests"]);
  });
  it("pure deterministic and preserves input with alphabetical keys", () => {
    const payload = { kind: "check-save-source", value: { localValue: "z", sdkAvailable: true, sdkValue: "y" } };
    const before = JSON.stringify(payload);
    const a = runFeature(payload);
    const b = runFeature(JSON.parse(before));
    assert.deepEqual(a, b);
    assert.equal(JSON.stringify(payload), before);
    assert.deepEqual(keysOf(a), sortedCopy(keysOf(a)));
    assert.deepEqual(keysOf(a.value), sortedCopy(keysOf(a.value)));
  });
});
