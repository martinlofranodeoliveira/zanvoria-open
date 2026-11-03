import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_crypto_call_guard.mjs";

const allowlist = [
  "atob",
  "btoa",
  "crypto.getRandomValues",
  "crypto.subtle.encrypt",
  "crypto.subtle.importKey",
  "TextEncoder.encode"
];

describe("wildbound crypto call guard", () => {
  it("exposes runFeature", () => {
    assert.equal(typeof runFeature, "function");
  });
  it("allowlisted calls return allowed true", () => {
    for (const call of allowlist) {
      const out = runFeature({ kind: "check-crypto-call", value: { call } });
      assert.deepStrictEqual(out, {
        kind: "check-crypto-call",
        ok: true,
        value: { allowed: true, call, issues: [], reason: null, valid: true }
      });
      assert.deepStrictEqual(Object.keys(out), ["kind", "ok", "value"]);
      assert.deepStrictEqual(Object.keys(out.value), ["allowed", "call", "issues", "reason", "valid"]);
    }
  });
  it("contract example crypto.subtle.encrypt", () => {
    const out = runFeature({ kind: "check-crypto-call", value: { call: "crypto.subtle.encrypt" } });
    assert.deepStrictEqual(out, {
      kind: "check-crypto-call",
      ok: true,
      value: { allowed: true, call: "crypto.subtle.encrypt", issues: [], reason: null, valid: true }
    });
  });
  it("well-formed unlisted call returns unlisted-call", () => {
    const out = runFeature({ kind: "check-crypto-call", value: { call: "fetch" } });
    assert.deepStrictEqual(out, {
      kind: "check-crypto-call",
      ok: true,
      value: { allowed: false, call: "fetch", issues: [], reason: "unlisted-call", valid: true }
    });
  });
  it("malformed non-string call echoes null", () => {
    const out = runFeature({ kind: "check-crypto-call", value: { call: { x: 1 } } });
    assert.deepStrictEqual(out, {
      kind: "check-crypto-call",
      ok: true,
      value: { allowed: false, call: null, issues: ["bad-call"], reason: null, valid: false }
    });
  });
  it("malformed string calls echo input", () => {
    const badStrings = ["", "has space", "a/b", "bad@call", "x".repeat(65)];
    for (const call of badStrings) {
      const out = runFeature({ kind: "check-crypto-call", value: { call } });
      assert.equal(out.ok, true);
      assert.equal(out.kind, "check-crypto-call");
      assert.equal(out.value.valid, false);
      assert.equal(out.value.allowed, false);
      assert.equal(out.value.reason, null);
      assert.deepStrictEqual(out.value.issues, ["bad-call"]);
      assert.equal(out.value.call, call);
    }
  });
  it("batch empty returns empty results", () => {
    const out = runFeature({ kind: "check-crypto-call-batch", value: { requests: [] } });
    assert.deepStrictEqual(out, {
      kind: "check-crypto-call-batch",
      ok: true,
      value: { results: [] }
    });
  });
  it("batch evaluates each independently in order", () => {
    const input = {
      kind: "check-crypto-call-batch",
      value: { requests: [{ call: "atob" }, { call: "fetch" }, { call: 7 }] }
    };
    const out = runFeature(input);
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-crypto-call-batch");
    assert.equal(out.value.results.length, 3);
    assert.deepStrictEqual(out.value.results[0], {
      allowed: true,
      call: "atob",
      issues: [],
      reason: null,
      valid: true
    });
    assert.deepStrictEqual(out.value.results[1], {
      allowed: false,
      call: "fetch",
      issues: [],
      reason: "unlisted-call",
      valid: true
    });
    assert.deepStrictEqual(out.value.results[2], {
      allowed: false,
      call: null,
      issues: ["bad-call"],
      reason: null,
      valid: false
    });
    for (const r of out.value.results) {
      assert.deepStrictEqual(Object.keys(r), ["allowed", "call", "issues", "reason", "valid"]);
    }
  });
  it("batch rejects more than 16 requests", () => {
    const requests = [];
    for (let i = 0; i < 17; i += 1) {
      requests.push({ call: "atob" });
    }
    const out = runFeature({ kind: "check-crypto-call-batch", value: { requests } });
    assert.equal(out.ok, false);
    assert.equal(out.value, null);
    assert.deepStrictEqual(out.issues, ["bad-requests"]);
    assert.deepStrictEqual(Object.keys(out), ["issues", "kind", "ok", "value"]);
  });
  it("batch rejects malformed element shape", () => {
    const out = runFeature({ kind: "check-crypto-call-batch", value: { requests: [{ call: "atob", extra: 1 }] } });
    assert.equal(out.ok, false);
    assert.deepStrictEqual(out.issues, ["bad-requests"]);
  });
  it("invalid kind payload and value map to single issues", () => {
    const badKind = runFeature({ kind: "nope", value: {} });
    assert.deepStrictEqual(badKind, { issues: ["bad-kind"], kind: "unknown", ok: false, value: null });
    const badPayload = runFeature(null);
    assert.deepStrictEqual(badPayload, { issues: ["bad-payload"], kind: "unknown", ok: false, value: null });
    const badArray = runFeature([]);
    assert.deepStrictEqual(badArray.issues, ["bad-payload"]);
    const badValue = runFeature({ kind: "check-crypto-call", value: {} });
    assert.deepStrictEqual(badValue, { issues: ["bad-value"], kind: "check-crypto-call", ok: false, value: null });
    const badBatchValue = runFeature({ kind: "check-crypto-call-batch", value: { wrong: [] } });
    assert.deepStrictEqual(badBatchValue.issues, ["bad-value"]);
  });
  it("preserves input and is deterministic", () => {
    const input = { kind: "check-crypto-call", value: { call: "btoa" } };
    const snapshot = JSON.parse(JSON.stringify(input));
    const first = runFeature(input);
    const second = runFeature(input);
    assert.deepStrictEqual(input, snapshot);
    assert.deepStrictEqual(first, second);
    const batch = { kind: "check-crypto-call-batch", value: { requests: [{ call: "btoa" }] } };
    const batchSnap = JSON.parse(JSON.stringify(batch));
    runFeature(batch);
    assert.deepStrictEqual(batch, batchSnap);
  });
});
