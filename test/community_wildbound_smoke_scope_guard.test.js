import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature, checkSmokeScope, checkSmokeScopeBatch } from "../js/community/wildbound_smoke_scope_guard.mjs";

describe("wildbound smoke scope guard", () => {
  it("check-smoke-scope javascript-syntax allowed", () => {
    const out = runFeature({ kind: "check-smoke-scope", value: { claim: "javascript-syntax" } });
    assert.deepEqual(out, { kind: "check-smoke-scope", ok: true, value: { allowed: true, claim: "javascript-syntax", issues: [], reason: null, valid: true } });
  });
  it("check-smoke-scope exhaustive-gameplay out-of-scope", () => {
    const out = runFeature({ kind: "check-smoke-scope", value: { claim: "exhaustive-gameplay" } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-smoke-scope");
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.reason, "out-of-scope");
    assert.equal(out.value.valid, true);
    assert.deepEqual(out.value.issues, []);
    assert.equal(out.value.claim, "exhaustive-gameplay");
  });
  it("check-smoke-scope malformed claim object bad-claim", () => {
    const out = runFeature({ kind: "check-smoke-scope", value: { claim: { x: 1 } } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-smoke-scope");
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.reason, null);
    assert.equal(out.value.claim, null);
    assert.deepEqual(out.value.issues, ["bad-claim"]);
  });
  it("batch evaluates independently in order with ordered keys", () => {
    const payload = { kind: "check-smoke-scope-batch", value: { requests: [{ claim: "javascript-syntax" }, { claim: "exhaustive-gameplay" }, { claim: "local-http-serving" }] } };
    const out = runFeature(payload);
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-smoke-scope-batch");
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].allowed, true);
    assert.equal(out.value.results[1].allowed, false);
    assert.equal(out.value.results[1].reason, "out-of-scope");
    assert.equal(out.value.results[2].claim, "local-http-serving");
    for (const r of out.value.results) {
      assert.deepEqual(Object.keys(r), ["allowed", "claim", "issues", "reason", "valid"]);
    }
    assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
  });
  it("unknown kind returns ok false unknown bad-kind", () => {
    const out = runFeature({ kind: "nope", value: {} });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-kind"]);
  });
  it("non-object payload returns ok false unknown bad-payload", () => {
    const out = runFeature(null);
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-payload"]);
  });
  it("single bad value shape returns bad-value", () => {
    const out = runFeature({ kind: "check-smoke-scope", value: { nope: 1 } });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "check-smoke-scope");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-value"]);
  });
  it("batch bad shape returns bad-requests", () => {
    const out = runFeature({ kind: "check-smoke-scope-batch", value: { nope: [] } });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "check-smoke-scope-batch");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-requests"]);
  });
  it("helpers expose pure checks", () => {
    const one = checkSmokeScope({ claim: "manual-open-start" });
    assert.equal(one.allowed, true);
    assert.equal(one.valid, true);
    const batch = checkSmokeScopeBatch({ requests: [{ claim: "procedural-renderer" }] });
    assert.equal(batch.results.length, 1);
    assert.equal(batch.results[0].allowed, true);
  });
});
