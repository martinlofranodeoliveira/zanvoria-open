import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_encrypt_config_guard.mjs";

describe("wildbound encrypt config guard", () => {
  it("accepts AES-GCM 12 encrypt", () => {
    const out = runFeature({kind: "check-encrypt-config", value: {algorithm: "AES-GCM", ivLength: 12, keyUsage: "encrypt"}});
    assert.deepEqual(out, {kind: "check-encrypt-config", ok: true, value: {algorithm: "AES-GCM", allowed: true, issues: [], ivLength: 12, keyUsage: "encrypt", reason: null, valid: true}});
  });
  it("orders keys alphabetically", () => {
    const out = runFeature({kind: "check-encrypt-config", value: {algorithm: "AES-GCM", ivLength: 12, keyUsage: "encrypt"}});
    assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
    assert.deepEqual(Object.keys(out.value), ["algorithm", "allowed", "issues", "ivLength", "keyUsage", "reason", "valid"]);
  });
  it("well-formed non-matching algorithm returns unexpected-config", () => {
    const out = runFeature({kind: "check-encrypt-config", value: {algorithm: "AES-CBC", ivLength: 12, keyUsage: "encrypt"}});
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.reason, "unexpected-config");
    assert.deepEqual(out.value.issues, []);
  });
  it("well-formed non-matching length and usage return unexpected-config", () => {
    const a = runFeature({kind: "check-encrypt-config", value: {algorithm: "AES-GCM", ivLength: 16, keyUsage: "encrypt"}});
    assert.equal(a.value.valid, true);
    assert.equal(a.value.allowed, false);
    assert.equal(a.value.reason, "unexpected-config");
    const b = runFeature({kind: "check-encrypt-config", value: {algorithm: "AES-GCM", ivLength: 12, keyUsage: "decrypt"}});
    assert.equal(b.value.valid, true);
    assert.equal(b.value.allowed, false);
    assert.equal(b.value.reason, "unexpected-config");
  });
  it("malformed single field echoes null and deterministic issue", () => {
    const out = runFeature({kind: "check-encrypt-config", value: {algorithm: 7, ivLength: 12, keyUsage: "encrypt"}});
    assert.deepEqual(out, {kind: "check-encrypt-config", ok: true, value: {algorithm: null, allowed: false, issues: ["bad-algorithm"], ivLength: 12, keyUsage: "encrypt", reason: null, valid: false}});
  });
  it("malformed charset returns bad issues in order", () => {
    const out = runFeature({kind: "check-encrypt-config", value: {algorithm: "aes-gcm", ivLength: "12", keyUsage: "ENCRYPT"}});
    assert.equal(out.value.valid, false);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.reason, null);
    assert.deepEqual(out.value.issues, ["bad-algorithm", "bad-iv-length", "bad-key-usage"]);
    assert.equal(out.value.algorithm, "aes-gcm");
    assert.equal(out.value.ivLength, null);
    assert.equal(out.value.keyUsage, "ENCRYPT");
  });
  it("all bad types echo null with ordered issues", () => {
    const out = runFeature({kind: "check-encrypt-config", value: {algorithm: null, ivLength: null, keyUsage: null}});
    assert.deepEqual(out.value.issues, ["bad-algorithm", "bad-iv-length", "bad-key-usage"]);
    assert.equal(out.value.algorithm, null);
    assert.equal(out.value.ivLength, null);
    assert.equal(out.value.keyUsage, null);
  });
  it("batch empty returns empty results", () => {
    const out = runFeature({kind: "check-encrypt-config-batch", value: {requests: []}});
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-encrypt-config-batch");
    assert.deepEqual(out.value, {results: []});
  });
  it("batch evaluates in order and preserves input", () => {
    const payload = {kind: "check-encrypt-config-batch", value: {requests: [{algorithm: "AES-GCM", ivLength: 12, keyUsage: "encrypt"}, {algorithm: "AES-CBC", ivLength: 12, keyUsage: "encrypt"}, {algorithm: "AES-GCM", ivLength: 12, keyUsage: "bad!"}]}};
    const before = JSON.stringify(payload);
    const out = runFeature(payload);
    assert.equal(out.ok, true);
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].allowed, true);
    assert.equal(out.value.results[0].valid, true);
    assert.equal(out.value.results[1].valid, true);
    assert.equal(out.value.results[1].allowed, false);
    assert.equal(out.value.results[1].reason, "unexpected-config");
    assert.equal(out.value.results[2].valid, false);
    assert.deepEqual(out.value.results[2].issues, ["bad-key-usage"]);
    assert.equal(JSON.stringify(payload), before);
    assert.deepEqual(Object.keys(out.value.results[0]), ["algorithm", "allowed", "issues", "ivLength", "keyUsage", "reason", "valid"]);
  });
  it("single preserves input without mutation", () => {
    const payload = {kind: "check-encrypt-config", value: {algorithm: "AES-GCM", ivLength: 12, keyUsage: "encrypt"}};
    const before = JSON.stringify(payload);
    runFeature(payload);
    assert.equal(JSON.stringify(payload), before);
  });
  it("is deterministic", () => {
    const p = {kind: "check-encrypt-config", value: {algorithm: "AES-GCM", ivLength: 12, keyUsage: "encrypt"}};
    assert.deepEqual(runFeature(p), runFeature({kind: "check-encrypt-config", value: {algorithm: "AES-GCM", ivLength: 12, keyUsage: "encrypt"}}));
  });
  it("bad-kind for unknown kind", () => {
    const out = runFeature({kind: "nope", value: null});
    assert.deepEqual(out, {issues: ["bad-kind"], kind: "unknown", ok: false, value: null});
  });
  it("bad-kind for missing kind", () => {
    const out = runFeature({value: {algorithm: "AES-GCM", ivLength: 12, keyUsage: "encrypt"}});
    assert.deepEqual(out.issues, ["bad-kind"]);
    assert.equal(out.kind, "unknown");
    assert.equal(out.ok, false);
    assert.equal(out.value, null);
  });
  it("bad-payload for non-object", () => {
    for (const bad of [null, 7, "x", []]) {
      const out = runFeature(bad);
      assert.deepEqual(out, {issues: ["bad-payload"], kind: "unknown", ok: false, value: null});
    }
  });
  it("bad-value for malformed single value", () => {
    const miss = runFeature({kind: "check-encrypt-config", value: {algorithm: "AES-GCM", ivLength: 12}});
    assert.deepEqual(miss.issues, ["bad-value"]);
    assert.equal(miss.ok, false);
    const extra = runFeature({kind: "check-encrypt-config", value: {algorithm: "AES-GCM", ivLength: 12, keyUsage: "encrypt", extra: 1}});
    assert.deepEqual(extra.issues, ["bad-value"]);
    const notObj = runFeature({kind: "check-encrypt-config", value: []});
    assert.deepEqual(notObj.issues, ["bad-value"]);
  });
  it("bad-requests for malformed batch value", () => {
    const a = runFeature({kind: "check-encrypt-config-batch", value: {requests: "no"}});
    assert.deepEqual(a.issues, ["bad-requests"]);
    const b = runFeature({kind: "check-encrypt-config-batch", value: {}});
    assert.deepEqual(b.issues, ["bad-requests"]);
    const c = runFeature({kind: "check-encrypt-config-batch", value: {requests: [], extra: 1}});
    assert.deepEqual(c.issues, ["bad-requests"]);
    const d = runFeature({kind: "check-encrypt-config-batch", value: {requests: [{algorithm: "AES-GCM", ivLength: 12}]}});
    assert.deepEqual(d.issues, ["bad-requests"]);
  });
  it("bad-requests for oversized batch", () => {
    const reqs = [];
    for (let i = 0; i < 17; i++) {
      reqs.push({algorithm: "AES-GCM", ivLength: 12, keyUsage: "encrypt"});
    }
    const out = runFeature({kind: "check-encrypt-config-batch", value: {requests: reqs}});
    assert.equal(out.ok, false);
    assert.deepEqual(out.issues, ["bad-requests"]);
  });
  it("error keys are alphabetically ordered", () => {
    const out = runFeature({kind: "nope", value: null});
    assert.deepEqual(Object.keys(out), ["issues", "kind", "ok", "value"]);
  });
});
