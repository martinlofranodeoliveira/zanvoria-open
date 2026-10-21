import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_settings_document_guard.mjs";

describe("wildbound settings document guard examples", () => {
  it("empty settings validate", () => {
    const out = runFeature({ kind: "check-settings-document", value: { settings: {} } });
    assert.deepStrictEqual(out, { kind: "check-settings-document", ok: true, value: { issues: [], settings: {}, storable: true, storedLength: 2, valid: true } });
  });
  it("populated settings validate", () => {
    const out = runFeature({ kind: "check-settings-document", value: { settings: { volume: 1 } } });
    assert.deepStrictEqual(out, { kind: "check-settings-document", ok: true, value: { issues: [], settings: { volume: 1 }, storable: true, storedLength: 12, valid: true } });
  });
  it("non-object settings yield bad-settings", () => {
    const out = runFeature({ kind: "check-settings-document", value: { settings: "loud" } });
    assert.deepStrictEqual(out, { kind: "check-settings-document", ok: true, value: { issues: ["bad-settings"], settings: null, storable: false, storedLength: null, valid: false } });
  });
});

describe("well-formed settings", () => {
  it("orders keys and sizes via stringify", () => {
    const out = runFeature({ kind: "check-settings-document", value: { settings: { b: true, a: null } } });
    assert.equal(out.ok, true);
    assert.deepStrictEqual(Object.keys(out.value.settings), ["a", "b"]);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.storable, true);
    assert.deepStrictEqual(out.value.issues, []);
    assert.equal(out.value.storedLength, JSON.stringify({ a: null, b: true }).length);
  });
  it("supports null boolean number and string values", () => {
    const out = runFeature({ kind: "check-settings-document", value: { settings: { a: null, b: false, c: 0, d: "hi" } } });
    assert.equal(out.value.valid, true);
    assert.equal(out.value.storable, true);
  });
  it("allows hyphen underscore keys and LF CR TAB", () => {
    const out = runFeature({ kind: "check-settings-document", value: { settings: { "a-b_cZ9": "x\n\r\ty" } } });
    assert.equal(out.value.valid, true);
  });
});

describe("malformed settings", () => {
  it("rejects bad keys", () => {
    const out = runFeature({ kind: "check-settings-document", value: { settings: { "bad key!": 1 } } });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, false);
    assert.deepStrictEqual(out.value.issues, ["bad-settings"]);
    assert.equal(out.value.storable, false);
    assert.equal(out.value.storedLength, null);
  });
  it("rejects nested object and array values", () => {
    const a = runFeature({ kind: "check-settings-document", value: { settings: { nested: { a: 1 } } } });
    assert.equal(a.value.valid, false);
    assert.deepStrictEqual(a.value.issues, ["bad-settings"]);
    const b = runFeature({ kind: "check-settings-document", value: { settings: { nested: [1] } } });
    assert.equal(b.value.valid, false);
  });
  it("rejects too many keys and out of range numbers", () => {
    const out = runFeature({ kind: "check-settings-document", value: { settings: { a1: 1, a2: 1, a3: 1, a4: 1, a5: 1, a6: 1, a7: 1, a8: 1, a9: 1 } } });
    assert.equal(out.value.valid, false);
    const big = runFeature({ kind: "check-settings-document", value: { settings: { n: 9007199254740992 } } });
    assert.equal(big.value.valid, false);
  });
  it("rejects control characters and lone surrogates", () => {
    const bad = runFeature({ kind: "check-settings-document", value: { settings: { name: "a\u0001b" } } });
    assert.equal(bad.value.valid, false);
    const lone = runFeature({ kind: "check-settings-document", value: { settings: { name: "\uD800" } } });
    assert.equal(lone.value.valid, false);
  });
});

describe("batch", () => {
  it("evaluates empty batch", () => {
    const out = runFeature({ kind: "check-settings-document-batch", value: { requests: [] } });
    assert.deepStrictEqual(out, { kind: "check-settings-document-batch", ok: true, value: { results: [] } });
  });
  it("evaluates wrappers independently in order", () => {
    const out = runFeature({ kind: "check-settings-document-batch", value: { requests: [{ settings: {} }, { settings: "loud" }, { settings: { volume: 1 } }] } });
    assert.equal(out.ok, true);
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].valid, true);
    assert.equal(out.value.results[1].valid, false);
    assert.deepStrictEqual(out.value.results[1].issues, ["bad-settings"]);
    assert.equal(out.value.results[2].valid, true);
  });
  it("rejects oversized batch with bad-requests", () => {
    const seeds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const requests = [];
    for (const seed of seeds) {
      requests.push({ settings: {} });
    }
    assert.equal(seeds.length, 17);
    const out = runFeature({ kind: "check-settings-document-batch", value: { requests } });
    assert.equal(out.ok, false);
    assert.deepStrictEqual(out.issues, ["bad-requests"]);
    assert.equal(out.value, null);
  });
});

describe("payload errors", () => {
  it("unknown kind returns bad-kind", () => {
    const out = runFeature({ kind: "nope", value: {} });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.deepStrictEqual(out.issues, ["bad-kind"]);
    assert.equal(out.value, null);
  });
  it("non-object payload returns bad-payload", () => {
    const out = runFeature(null);
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.deepStrictEqual(out.issues, ["bad-payload"]);
  });
  it("malformed single value returns bad-value", () => {
    const out = runFeature({ kind: "check-settings-document", value: {} });
    assert.equal(out.ok, false);
    assert.deepStrictEqual(out.issues, ["bad-value"]);
    assert.equal(out.kind, "check-settings-document");
  });
  it("malformed batch value returns bad-value or bad-requests", () => {
    const a = runFeature({ kind: "check-settings-document-batch", value: {} });
    assert.equal(a.ok, false);
    const b = runFeature({ kind: "check-settings-document-batch", value: { requests: "x" } });
    assert.equal(b.ok, false);
    assert.deepStrictEqual(b.issues, ["bad-requests"]);
  });
  it("preserves input orders keys and stays deterministic", () => {
    const payload = { kind: "check-settings-document", value: { settings: { z: 1, a: 1 } } };
    const snap = JSON.stringify(payload);
    const out = runFeature(payload);
    assert.equal(JSON.stringify(payload), snap);
    assert.deepStrictEqual(Object.keys(out), ["kind", "ok", "value"]);
    assert.deepStrictEqual(Object.keys(out.value), ["issues", "settings", "storable", "storedLength", "valid"]);
    const again = runFeature(JSON.parse(snap));
    assert.deepStrictEqual(out, again);
  });
});
