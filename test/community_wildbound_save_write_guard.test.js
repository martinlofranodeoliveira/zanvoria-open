import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature, checkSaveWrite, checkSaveWriteBatch } from "../js/community/wildbound_save_write_guard.mjs";
const innerKeys = ["issues", "localWrite", "sdkWritable", "sdkWrite", "usingCrazyGames", "valid"];
describe("wildbound save write guard examples", () => {
  it("both true yields sdkWrite true", () => {
    const out = runFeature({ kind: "check-save-write", value: { sdkWritable: true, usingCrazyGames: true } });
    assert.deepEqual(out, { kind: "check-save-write", ok: true, value: { issues: [], localWrite: true, sdkWritable: true, sdkWrite: true, usingCrazyGames: true, valid: true } });
  });
  it("using false yields sdkWrite false", () => {
    const out = runFeature({ kind: "check-save-write", value: { sdkWritable: true, usingCrazyGames: false } });
    assert.deepEqual(out, { kind: "check-save-write", ok: true, value: { issues: [], localWrite: true, sdkWritable: true, sdkWrite: false, usingCrazyGames: false, valid: true } });
  });
  it("bad sdkWritable yields valid false", () => {
    const out = runFeature({ kind: "check-save-write", value: { sdkWritable: "yes", usingCrazyGames: true } });
    assert.deepEqual(out, { kind: "check-save-write", ok: true, value: { issues: ["bad-sdk-writable"], localWrite: null, sdkWritable: null, sdkWrite: null, usingCrazyGames: true, valid: false } });
  });
});
describe("local-always holds", () => {
  it("all boolean combos keep localWrite true and sdkWrite only when both true", () => {
    const combos = [
      [true, true, true],
      [true, false, false],
      [false, true, false],
      [false, false, false]
    ];
    for (const c of combos) {
      const out = runFeature({ kind: "check-save-write", value: { sdkWritable: c[0], usingCrazyGames: c[1] } });
      assert.equal(out.ok, true);
      assert.equal(out.value.valid, true);
      assert.equal(out.value.localWrite, true);
      assert.equal(out.value.sdkWrite, c[2]);
      assert.deepEqual(Object.keys(out.value), innerKeys);
    }
  });
  it("malformed flags order deterministic", () => {
    const a = runFeature({ kind: "check-save-write", value: { sdkWritable: 1, usingCrazyGames: true } });
    assert.deepEqual(a.value.issues, ["bad-sdk-writable"]);
    assert.equal(a.value.valid, false);
    assert.equal(a.value.localWrite, null);
    assert.equal(a.value.sdkWrite, null);
    const b = runFeature({ kind: "check-save-write", value: { sdkWritable: true, usingCrazyGames: 0 } });
    assert.deepEqual(b.value.issues, ["bad-using-flag"]);
    const c = runFeature({ kind: "check-save-write", value: { sdkWritable: null, usingCrazyGames: null } });
    assert.deepEqual(c.value.issues, ["bad-sdk-writable", "bad-using-flag"]);
    assert.equal(c.value.sdkWritable, null);
    assert.equal(c.value.usingCrazyGames, null);
  });
});
describe("batch", () => {
  it("empty batch returns empty results", () => {
    const out = runFeature({ kind: "check-save-write-batch", value: { requests: [] } });
    assert.equal(out.ok, true);
    assert.deepEqual(out.value, { results: [] });
    assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
  });
  it("evaluates each entry independently in order", () => {
    const out = runFeature({ kind: "check-save-write-batch", value: { requests: [{ sdkWritable: true, usingCrazyGames: true }, { sdkWritable: true, usingCrazyGames: false }, { sdkWritable: "x", usingCrazyGames: true }] } });
    assert.equal(out.ok, true);
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].valid, true);
    assert.equal(out.value.results[0].sdkWrite, true);
    assert.equal(out.value.results[1].sdkWrite, false);
    assert.deepEqual(out.value.results[2].issues, ["bad-sdk-writable"]);
    assert.equal(out.value.results[2].valid, false);
    for (const r of out.value.results) {
      assert.deepEqual(Object.keys(r), innerKeys);
    }
  });
  it("rejects too many requests", () => {
    const reqs = [];
    for (let i = 0; i < 17; i++) reqs.push({ sdkWritable: true, usingCrazyGames: true });
    const out = runFeature({ kind: "check-save-write-batch", value: { requests: reqs } });
    assert.equal(out.ok, false);
    assert.deepEqual(out.issues, ["bad-requests"]);
  });
  it("rejects non-array requests", () => {
    const out = runFeature({ kind: "check-save-write-batch", value: { requests: "x" } });
    assert.deepEqual(out.issues, ["bad-requests"]);
  });
});
describe("invalid kind payload value", () => {
  it("non-object payload yields bad-payload", () => {
    assert.deepEqual(runFeature(null), { issues: ["bad-payload"], kind: "unknown", ok: false, value: null });
    assert.deepEqual(runFeature([]), { issues: ["bad-payload"], kind: "unknown", ok: false, value: null });
  });
  it("unknown kind yields bad-kind", () => {
    assert.deepEqual(runFeature({ kind: "nope", value: {} }).issues, ["bad-kind"]);
    assert.deepEqual(runFeature({}).issues, ["bad-kind"]);
  });
  it("malformed single value yields bad-value", () => {
    const out = runFeature({ kind: "check-save-write", value: { sdkWritable: true } });
    assert.deepEqual(out, { issues: ["bad-value"], kind: "check-save-write", ok: false, value: null });
  });
  it("top-level keys alphabetical", () => {
    const out = runFeature({ kind: "check-save-write", value: null });
    assert.deepEqual(Object.keys(out), ["issues", "kind", "ok", "value"]);
    const ok = runFeature({ kind: "check-save-write", value: { sdkWritable: false, usingCrazyGames: false } });
    assert.deepEqual(Object.keys(ok), ["kind", "ok", "value"]);
  });
  it("preserves input", () => {
    const p = { kind: "check-save-write", value: { sdkWritable: true, usingCrazyGames: true } };
    const before = JSON.stringify(p);
    runFeature(p);
    assert.equal(JSON.stringify(p), before);
  });
  it("helpers are pure", () => {
    assert.equal(typeof checkSaveWrite, "function");
    assert.equal(typeof checkSaveWriteBatch, "function");
    const r = checkSaveWrite({ sdkWritable: false, usingCrazyGames: true });
    assert.equal(r.localWrite, true);
    assert.equal(r.sdkWrite, false);
  });
});
