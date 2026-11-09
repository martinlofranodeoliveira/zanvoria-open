import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature, checkEncryptSize, checkEncryptSizeBatch } from "../js/community/wildbound_encrypt_size_guard.mjs";

const orderedSeven = ["allowed", "cipherLen", "encodedLen", "issues", "ivLen", "rawLen", "valid"];

function clone(input) {
  return JSON.parse(JSON.stringify(input));
}

describe("wildbound encrypt size guard", () => {
  it("IV 12 cipher 16 yields valid allowed raw 28 encoded 40", () => {
    const input = { kind: "check-encrypt-size", value: { cipherLen: 16, ivLen: 12 } };
    const before = clone(input);
    const out = runFeature(input);
    assert.deepStrictEqual(out, {
      kind: "check-encrypt-size",
      ok: true,
      value: { allowed: true, cipherLen: 16, encodedLen: 40, issues: [], ivLen: 12, rawLen: 28, valid: true }
    });
    assert.deepStrictEqual(input, before);
    assert.deepStrictEqual(Object.keys(out), ["kind", "ok", "value"]);
    assert.deepStrictEqual(Object.keys(out.value), orderedSeven);
  });
  it("nonstandard IV 8 cipher 20 yields allowed false single nonstandard-iv", () => {
    const input = { kind: "check-encrypt-size", value: { cipherLen: 20, ivLen: 8 } };
    const before = clone(input);
    const out = runFeature(input);
    assert.deepStrictEqual(out, {
      kind: "check-encrypt-size",
      ok: true,
      value: { allowed: false, cipherLen: 20, encodedLen: 40, issues: ["nonstandard-iv"], ivLen: 8, rawLen: 28, valid: true }
    });
    assert.deepStrictEqual(input, before);
  });
  it("malformed cipherLen object yields valid false with bad-cipherLen", () => {
    const input = { kind: "check-encrypt-size", value: { cipherLen: { x: 1 }, ivLen: 12 } };
    const out = runFeature(input);
    assert.deepStrictEqual(out, {
      kind: "check-encrypt-size",
      ok: true,
      value: { allowed: false, cipherLen: null, encodedLen: null, issues: ["bad-cipherLen"], ivLen: 12, rawLen: null, valid: false }
    });
    assert.deepStrictEqual(Object.keys(out.value), orderedSeven);
  });
  it("both fields malformed yields alphabetical bad-cipherLen bad-ivLen", () => {
    const input = { kind: "check-encrypt-size", value: { cipherLen: -5, ivLen: 999 } };
    const out = runFeature(input);
    assert.deepStrictEqual(out.value.issues, ["bad-cipherLen", "bad-ivLen"]);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.rawLen, null);
    assert.equal(out.value.encodedLen, null);
    assert.equal(out.value.cipherLen, null);
    assert.equal(out.value.ivLen, null);
  });
  it("batch empty returns empty results", () => {
    const input = { kind: "check-encrypt-size-batch", value: { requests: [] } };
    const out = runFeature(input);
    assert.deepStrictEqual(out, { kind: "check-encrypt-size-batch", ok: true, value: { results: [] } });
  });
  it("batch evaluates each entry independently in order", () => {
    const input = {
      kind: "check-encrypt-size-batch",
      value: { requests: [{ cipherLen: 16, ivLen: 12 }, { cipherLen: 20, ivLen: 8 }, { cipherLen: -1, ivLen: 12 }] }
    };
    const before = clone(input);
    const out = runFeature(input);
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-encrypt-size-batch");
    assert.equal(out.value.results.length, 3);
    assert.deepStrictEqual(out.value.results[0], { allowed: true, cipherLen: 16, encodedLen: 40, issues: [], ivLen: 12, rawLen: 28, valid: true });
    assert.deepStrictEqual(out.value.results[1], { allowed: false, cipherLen: 20, encodedLen: 40, issues: ["nonstandard-iv"], ivLen: 8, rawLen: 28, valid: true });
    assert.deepStrictEqual(out.value.results[2], { allowed: false, cipherLen: null, encodedLen: null, issues: ["bad-cipherLen"], ivLen: 12, rawLen: null, valid: false });
    for (const r of out.value.results) {
      assert.deepStrictEqual(Object.keys(r), orderedSeven);
    }
    assert.deepStrictEqual(input, before);
  });
  it("batch rejects malformed shape with bad-requests", () => {
    const bad1 = runFeature({ kind: "check-encrypt-size-batch", value: { cipherLen: 1, ivLen: 2 } });
    assert.deepStrictEqual(bad1, { issues: ["bad-requests"], kind: "check-encrypt-size-batch", ok: false, value: null });
    const bad2 = runFeature({ kind: "check-encrypt-size-batch", value: { requests: [{ cipherLen: 16 }] } });
    assert.deepStrictEqual(bad2.issues, ["bad-requests"]);
    assert.equal(bad2.ok, false);
    const many = [];
    for (let i = 0; i < 17; i += 1) {
      many.push({ cipherLen: 1, ivLen: 12 });
    }
    const bad3 = runFeature({ kind: "check-encrypt-size-batch", value: { requests: many } });
    assert.deepStrictEqual(bad3.issues, ["bad-requests"]);
  });
  it("invalid kind and non-object payload map to unknown", () => {
    assert.deepStrictEqual(runFeature({ kind: "nope", value: {} }), { issues: ["bad-kind"], kind: "unknown", ok: false, value: null });
    assert.deepStrictEqual(runFeature(null), { issues: ["bad-payload"], kind: "unknown", ok: false, value: null });
    assert.deepStrictEqual(runFeature([]), { issues: ["bad-payload"], kind: "unknown", ok: false, value: null });
    assert.deepStrictEqual(runFeature({ value: {} }), { issues: ["bad-kind"], kind: "unknown", ok: false, value: null });
  });
  it("malformed single value returns bad-value with kind echo", () => {
    const out = runFeature({ kind: "check-encrypt-size", value: { cipherLen: 1 } });
    assert.deepStrictEqual(out, { issues: ["bad-value"], kind: "check-encrypt-size", ok: false, value: null });
    const out2 = runFeature({ kind: "check-encrypt-size", value: null });
    assert.deepStrictEqual(out2.issues, ["bad-value"]);
  });
  it("helpers are pure functions and deterministic", () => {
    assert.equal(typeof checkEncryptSize, "function");
    assert.equal(typeof checkEncryptSizeBatch, "function");
    const a = runFeature({ kind: "check-encrypt-size", value: { cipherLen: 16, ivLen: 12 } });
    const b = runFeature({ kind: "check-encrypt-size", value: { cipherLen: 16, ivLen: 12 } });
    assert.deepStrictEqual(a, b);
    const direct = checkEncryptSize({ cipherLen: 16, ivLen: 12 });
    assert.deepStrictEqual(Object.keys(direct), orderedSeven);
  });
  it("error outputs order keys alphabetically", () => {
    const out = runFeature({ kind: "bad", value: 1 });
    assert.deepStrictEqual(Object.keys(out), ["issues", "kind", "ok", "value"]);
    const out2 = runFeature({ kind: "check-encrypt-size", value: {} });
    assert.deepStrictEqual(Object.keys(out2), ["issues", "kind", "ok", "value"]);
  });
});
