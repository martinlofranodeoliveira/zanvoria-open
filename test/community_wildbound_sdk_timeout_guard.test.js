import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature, checkSdkTimeout, checkSdkTimeoutBatch } from "../js/community/wildbound_sdk_timeout_guard.mjs";

const ORDERED_KEYS = ["allowed", "expected", "issues", "matched", "reason", "timeoutMs", "valid"];

describe("wildbound sdk timeout guard single matched", () => {
  it("1400 returns matched true", () => {
    const out = runFeature({kind: "check-sdk-timeout", value: {timeoutMs: 1400}});
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-sdk-timeout");
    assert.equal(out.value.allowed, true);
    assert.equal(out.value.expected, 1400);
    assert.deepEqual(out.value.issues, []);
    assert.equal(out.value.matched, true);
    assert.equal(out.value.reason, null);
    assert.equal(out.value.timeoutMs, 1400);
    assert.equal(out.value.valid, true);
    assert.deepEqual(Object.keys(out.value), ORDERED_KEYS);
    assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
  });
  it("1000 returns nonstandard-timeout", () => {
    const out = runFeature({kind: "check-sdk-timeout", value: {timeoutMs: 1000}});
    assert.equal(out.ok, true);
    assert.equal(out.value.matched, false);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.expected, 1400);
    assert.equal(out.value.reason, "nonstandard-timeout");
    assert.equal(out.value.valid, true);
    assert.deepEqual(out.value.issues, []);
    assert.deepEqual(Object.keys(out.value), ORDERED_KEYS);
  });
  it("malformed timeout returns valid false bad-timeout", () => {
    const out = runFeature({kind: "check-sdk-timeout", value: {timeoutMs: {x: 1}}});
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.matched, false);
    assert.deepEqual(out.value.issues, ["bad-timeout"]);
    assert.equal(out.value.reason, null);
    assert.equal(out.value.timeoutMs, null);
    assert.equal(out.value.expected, 1400);
    assert.deepEqual(Object.keys(out.value), ORDERED_KEYS);
  });
  it("string timeout echoes null", () => {
    const out = runFeature({kind: "check-sdk-timeout", value: {timeoutMs: "1400"}});
    assert.equal(out.value.valid, false);
    assert.equal(out.value.timeoutMs, null);
    assert.deepEqual(out.value.issues, ["bad-timeout"]);
  });
  it("float timeout echoes number", () => {
    const out = runFeature({kind: "check-sdk-timeout", value: {timeoutMs: 1.5}});
    assert.equal(out.value.valid, false);
    assert.equal(out.value.timeoutMs, 1.5);
  });
});

describe("wildbound sdk timeout guard batch", () => {
  it("evaluates each request in order", () => {
    const out = runFeature({kind: "check-sdk-timeout-batch", value: {requests: [{timeoutMs: 1400}, {timeoutMs: 1000}, {timeoutMs: "x"}]}});
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-sdk-timeout-batch");
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].matched, true);
    assert.equal(out.value.results[0].allowed, true);
    assert.equal(out.value.results[0].valid, true);
    assert.equal(out.value.results[1].matched, false);
    assert.equal(out.value.results[1].reason, "nonstandard-timeout");
    assert.equal(out.value.results[2].valid, false);
    assert.deepEqual(out.value.results[2].issues, ["bad-timeout"]);
    for (const r of out.value.results) {
      assert.deepEqual(Object.keys(r), ORDERED_KEYS);
    }
    assert.deepEqual(Object.keys(out.value), ["results"]);
  });
  it("empty batch succeeds", () => {
    const out = runFeature({kind: "check-sdk-timeout-batch", value: {requests: []}});
    assert.equal(out.ok, true);
    assert.deepEqual(out.value.results, []);
  });
  it("helpers are pure deterministic", () => {
    const a = checkSdkTimeout({timeoutMs: 1400});
    const b = checkSdkTimeout({timeoutMs: 1400});
    assert.deepEqual(a, b);
    const arr = checkSdkTimeoutBatch({requests: [{timeoutMs: 1400}]});
    assert.equal(arr.length, 1);
    assert.equal(arr[0].matched, true);
  });
});

describe("wildbound sdk timeout guard errors", () => {
  it("unknown kind returns bad-kind", () => {
    const out = runFeature({kind: "nope", value: null});
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-kind"]);
  });
  it("non-object payload returns bad-payload", () => {
    const out = runFeature(null);
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-payload"]);
  });
  it("missing value for single returns bad-value", () => {
    const out = runFeature({kind: "check-sdk-timeout", value: null});
    assert.equal(out.ok, false);
    assert.equal(out.kind, "check-sdk-timeout");
    assert.deepEqual(out.issues, ["bad-value"]);
  });
  it("bad requests shape returns bad-requests", () => {
    const out = runFeature({kind: "check-sdk-timeout-batch", value: {requests: "x"}});
    assert.equal(out.ok, false);
    assert.deepEqual(out.issues, ["bad-requests"]);
  });
  it("preserves input and stays deterministic", () => {
    const payload = {kind: "check-sdk-timeout", value: {timeoutMs: 1400}};
    const before = JSON.stringify(payload);
    const first = runFeature(payload);
    const second = runFeature(payload);
    assert.deepEqual(first, second);
    assert.equal(JSON.stringify(payload), before);
    assert.deepEqual(first, {kind: "check-sdk-timeout", ok: true, value: {allowed: true, expected: 1400, issues: [], matched: true, reason: null, timeoutMs: 1400, valid: true}});
  });
});
