import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_bridge_method_guard.mjs";

const ORDERED_FIVE = ["allowed", "issues", "method", "reason", "valid"];
const OUTER_OK = ["kind", "ok", "value"];
const OUTER_ERR = ["issues", "kind", "ok", "value"];
const VALID_REASONS = ["bad-kind", "bad-payload", "bad-value", "bad-requests"];

describe("wildbound bridge method guard", () => {
  it("allowlisted getSave returns ok true with ordered keys", () => {
    const out = runFeature({ kind: "check-bridge-method", value: { method: "getSave" } });
    assert.deepEqual(out, { kind: "check-bridge-method", ok: true, value: { allowed: true, issues: [], method: "getSave", reason: null, valid: true } });
    assert.deepEqual(Object.keys(out), OUTER_OK);
    assert.deepEqual(Object.keys(out.value), ORDERED_FIVE);
  });
  it("unlisted submitHighScore returns unlisted-method", () => {
    const out = runFeature({ kind: "check-bridge-method", value: { method: "submitHighScore" } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-bridge-method");
    assert.equal(out.value.valid, true);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.reason, "unlisted-method");
    assert.deepEqual(out.value.issues, []);
    assert.deepEqual(Object.keys(out.value), ORDERED_FIVE);
  });
  it("malformed method object returns valid false with method null", () => {
    const out = runFeature({ kind: "check-bridge-method", value: { method: { x: 1 } } });
    assert.deepEqual(out, { kind: "check-bridge-method", ok: true, value: { allowed: false, issues: ["bad-method"], method: null, reason: null, valid: false } });
    assert.deepEqual(Object.keys(out.value), ORDERED_FIVE);
  });
  it("malformed letters with digits returns valid false echoing string", () => {
    const out = runFeature({ kind: "check-bridge-method", value: { method: "abc123" } });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.method, "abc123");
    assert.deepEqual(out.value.issues, ["bad-method"]);
  });
  it("batch evaluates each entry independently in order", () => {
    const out = runFeature({ kind: "check-bridge-method-batch", value: { requests: [{ method: "getSave" }, { method: "submitHighScore" }, { method: { x: 1 } }] } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-bridge-method-batch");
    assert.deepEqual(Object.keys(out), OUTER_OK);
    assert.equal(out.value.results.length, 3);
    for (const r of out.value.results) {
      assert.deepEqual(Object.keys(r), ORDERED_FIVE);
    }
    assert.equal(out.value.results[0].allowed, true);
    assert.equal(out.value.results[0].valid, true);
    assert.equal(out.value.results[1].allowed, false);
    assert.equal(out.value.results[1].reason, "unlisted-method");
    assert.equal(out.value.results[2].valid, false);
    assert.deepEqual(out.value.results[2].issues, ["bad-method"]);
  });
  it("empty batch returns empty results", () => {
    const out = runFeature({ kind: "check-bridge-method-batch", value: { requests: [] } });
    assert.equal(out.ok, true);
    assert.deepEqual(out.value.results, []);
  });
  it("unknown kind returns ok false with kind unknown", () => {
    const out = runFeature({ kind: "nope", value: {} });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.equal(out.value, null);
    assert.equal(out.issues.length, 1);
    assert.deepEqual(Object.keys(out), OUTER_ERR);
  });
  it("non-object payload returns bad-payload", () => {
    for (const bad of [null, "x", 42, []]) {
      const out = runFeature(bad);
      assert.equal(out.ok, false);
      assert.equal(out.kind, "unknown");
      assert.equal(out.value, null);
      assert.equal(out.issues.length, 1);
    }
  });
  it("malformed single value returns ok false echoing kind", () => {
    const out = runFeature({ kind: "check-bridge-method", value: {} });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "check-bridge-method");
    assert.equal(out.value, null);
    assert.ok(VALID_REASONS.includes(out.issues[0]));
  });
  it("malformed batch requests returns ok false", () => {
    const out = runFeature({ kind: "check-bridge-method-batch", value: { requests: "no" } });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "check-bridge-method-batch");
    assert.equal(out.value, null);
    assert.ok(VALID_REASONS.includes(out.issues[0]));
    const many = [];
    for (let i = 0; i < 17; i++) {
      many.push({ method: "getSave" });
    }
    const out2 = runFeature({ kind: "check-bridge-method-batch", value: { requests: many } });
    assert.equal(out2.ok, false);
    assert.ok(VALID_REASONS.includes(out2.issues[0]));
  });
  it("preserves input", () => {
    const payload = { kind: "check-bridge-method", value: { method: "getSave" } };
    const snap = JSON.stringify(payload);
    runFeature(payload);
    assert.equal(JSON.stringify(payload), snap);
  });
});
