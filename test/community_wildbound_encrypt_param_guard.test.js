import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_encrypt_param_guard.mjs";
function keysOf(v) {
  return Object.keys(v);
}
describe("wildbound encrypt param guard", () => {
  it("accepts AES-GCM 12 raw as allowed", () => {
    const out = runFeature({ kind: "check-encrypt-param", value: { algorithm: "AES-GCM", ivLength: 12, keyFormat: "raw" } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-encrypt-param");
    assert.deepEqual(keysOf(out), ["kind", "ok", "value"]);
    assert.deepEqual(keysOf(out.value), ["algorithm", "allowed", "issues", "ivLength", "keyFormat", "reason", "valid"]);
    assert.equal(out.value.allowed, true);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.reason, null);
    assert.deepEqual(out.value.issues, []);
  });
  it("rejects mismatched fields with priority", () => {
    const a = runFeature({ kind: "check-encrypt-param", value: { algorithm: "AES-CBC", ivLength: 12, keyFormat: "raw" } });
    assert.equal(a.value.valid, true);
    assert.equal(a.value.allowed, false);
    assert.equal(a.value.reason, "unsupported-algorithm");
    const b = runFeature({ kind: "check-encrypt-param", value: { algorithm: "AES-GCM", ivLength: 16, keyFormat: "raw" } });
    assert.equal(b.value.reason, "bad-iv-length");
    assert.equal(b.value.allowed, false);
    const c = runFeature({ kind: "check-encrypt-param", value: { algorithm: "AES-GCM", ivLength: 12, keyFormat: "jwk" } });
    assert.equal(c.value.reason, "bad-key-format");
    const d = runFeature({ kind: "check-encrypt-param", value: { algorithm: "AES-CBC", ivLength: 16, keyFormat: "jwk" } });
    assert.equal(d.value.reason, "unsupported-algorithm");
  });
  it("flags malformed fields with ordered issues", () => {
    const out = runFeature({ kind: "check-encrypt-param", value: { algorithm: 123, ivLength: "12", keyFormat: "RAW" } });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.reason, null);
    assert.deepEqual(out.value.issues, ["bad-algorithm", "bad-iv-length", "bad-key-format"]);
    assert.equal(out.value.algorithm, null);
    assert.equal(out.value.ivLength, null);
    assert.equal(out.value.keyFormat, "RAW");
    const single = runFeature({ kind: "check-encrypt-param", value: { algorithm: 123, ivLength: 12, keyFormat: "raw" } });
    assert.deepEqual(single.value.issues, ["bad-algorithm"]);
    assert.equal(single.value.algorithm, null);
  });
  it("handles batch independently and ordered", () => {
    const out = runFeature({ kind: "check-encrypt-param-batch", value: { requests: [{ algorithm: "AES-GCM", ivLength: 12, keyFormat: "raw" }, { algorithm: "AES-GCM", ivLength: 16, keyFormat: "raw" }] } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-encrypt-param-batch");
    assert.equal(out.value.results.length, 2);
    assert.equal(out.value.results[0].allowed, true);
    assert.equal(out.value.results[1].reason, "bad-iv-length");
    for (const r of out.value.results) {
      assert.deepEqual(keysOf(r), ["algorithm", "allowed", "issues", "ivLength", "keyFormat", "reason", "valid"]);
    }
    const empty = runFeature({ kind: "check-encrypt-param-batch", value: { requests: [] } });
    assert.deepEqual(empty.value.results, []);
  });
  it("returns ok false with ordered keys for bad envelope", () => {
    const a = runFeature({ kind: "nope", value: null });
    assert.equal(a.ok, false);
    assert.equal(a.kind, "unknown");
    assert.deepEqual(keysOf(a), ["issues", "kind", "ok", "value"]);
    assert.deepEqual(a.issues, ["bad-kind"]);
    const b = runFeature(null);
    assert.deepEqual(b.issues, ["bad-payload"]);
    const c = runFeature({ kind: "check-encrypt-param", value: null });
    assert.deepEqual(c.issues, ["bad-value"]);
    assert.equal(c.kind, "check-encrypt-param");
    const d = runFeature({ kind: "check-encrypt-param-batch", value: { requests: "x" } });
    assert.deepEqual(d.issues, ["bad-requests"]);
    const e = runFeature({ kind: "check-encrypt-param", value: { algorithm: "AES-GCM", ivLength: 12 } });
    assert.deepEqual(e.issues, ["bad-value"]);
  });
  it("stays pure deterministic", () => {
    const p = { kind: "check-encrypt-param", value: { algorithm: "AES-GCM", ivLength: 12, keyFormat: "raw" } };
    const x = runFeature(p);
    const y = runFeature({ kind: "check-encrypt-param", value: { algorithm: "AES-GCM", ivLength: 12, keyFormat: "raw" } });
    assert.deepEqual(x, y);
    assert.deepEqual(p, { kind: "check-encrypt-param", value: { algorithm: "AES-GCM", ivLength: 12, keyFormat: "raw" } });
    assert.deepEqual(x, { kind: "check-encrypt-param", ok: true, value: { algorithm: "AES-GCM", allowed: true, issues: [], ivLength: 12, keyFormat: "raw", reason: null, valid: true } });
  });
});
