import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_ad_enable_guard.mjs";

describe("wildbound ad enable guard", () => {
  it("well-formed enabled with api allows attempt", () => {
    const out = runFeature({ kind: "check-ad-enable", value: { adsEnabled: true, hasAdApi: true } });
    assert.deepEqual(out, { kind: "check-ad-enable", ok: true, value: { adsEnabled: true, allowed: true, attempted: true, hasAdApi: true, issues: [], reason: null, valid: true } });
  });
  it("disabled returns ads-disabled", () => {
    const out = runFeature({ kind: "check-ad-enable", value: { adsEnabled: false, hasAdApi: true } });
    assert.deepEqual(out, { kind: "check-ad-enable", ok: true, value: { adsEnabled: false, allowed: false, attempted: false, hasAdApi: true, issues: [], reason: "ads-disabled", valid: true } });
  });
  it("missing api returns ad-api-unavailable", () => {
    const out = runFeature({ kind: "check-ad-enable", value: { adsEnabled: true, hasAdApi: false } });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.attempted, false);
    assert.equal(out.value.reason, "ad-api-unavailable");
  });
  it("both false prefers ads-disabled", () => {
    const out = runFeature({ kind: "check-ad-enable", value: { adsEnabled: false, hasAdApi: false } });
    assert.equal(out.value.reason, "ads-disabled");
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.attempted, false);
  });
  it("malformed single flag echoes null", () => {
    const out = runFeature({ kind: "check-ad-enable", value: { adsEnabled: "yes", hasAdApi: true } });
    assert.deepEqual(out, { kind: "check-ad-enable", ok: true, value: { adsEnabled: null, allowed: false, attempted: false, hasAdApi: true, issues: ["bad-ads-enabled"], reason: null, valid: false } });
  });
  it("both malformed ordered issues", () => {
    const out = runFeature({ kind: "check-ad-enable", value: { adsEnabled: 1, hasAdApi: null } });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.attempted, false);
    assert.equal(out.value.adsEnabled, null);
    assert.equal(out.value.hasAdApi, null);
    assert.deepEqual(out.value.issues, ["bad-ads-enabled", "bad-ad-api"]);
    assert.equal(out.value.reason, null);
  });
  it("single missing key returns bad-value", () => {
    const out = runFeature({ kind: "check-ad-enable", value: { adsEnabled: true } });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "check-ad-enable");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-value"]);
  });
  it("single extra key returns bad-value", () => {
    const out = runFeature({ kind: "check-ad-enable", value: { adsEnabled: true, hasAdApi: true, extra: 1 } });
    assert.equal(out.ok, false);
    assert.deepEqual(out.issues, ["bad-value"]);
    assert.equal(out.value, null);
  });
  it("batch empty succeeds", () => {
    const out = runFeature({ kind: "check-ad-enable-batch", value: { requests: [] } });
    assert.deepEqual(out, { kind: "check-ad-enable-batch", ok: true, value: { results: [] } });
  });
  it("batch evaluates independently in order", () => {
    const out = runFeature({ kind: "check-ad-enable-batch", value: { requests: [{ adsEnabled: true, hasAdApi: true }, { adsEnabled: false, hasAdApi: true }, { adsEnabled: "x", hasAdApi: false }] } });
    assert.equal(out.ok, true);
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].allowed, true);
    assert.equal(out.value.results[0].valid, true);
    assert.equal(out.value.results[1].reason, "ads-disabled");
    assert.equal(out.value.results[2].valid, false);
    assert.deepEqual(out.value.results[2].issues, ["bad-ads-enabled"]);
    assert.deepEqual(Object.keys(out.value.results[0]), ["adsEnabled", "allowed", "attempted", "hasAdApi", "issues", "reason", "valid"]);
  });
  it("batch element missing key returns bad-requests", () => {
    const out = runFeature({ kind: "check-ad-enable-batch", value: { requests: [{ adsEnabled: true }] } });
    assert.equal(out.ok, false);
    assert.deepEqual(out.issues, ["bad-requests"]);
    assert.equal(out.value, null);
  });
  it("batch 16 allowed, 17 rejected", () => {
    const okReqs = [];
    for (let i = 0; i < 16; i++) okReqs.push({ adsEnabled: true, hasAdApi: true });
    const okOut = runFeature({ kind: "check-ad-enable-batch", value: { requests: okReqs } });
    assert.equal(okOut.ok, true);
    assert.equal(okOut.value.results.length, 16);
    const badReqs = [];
    for (let i = 0; i < 17; i++) badReqs.push({ adsEnabled: true, hasAdApi: true });
    const badOut = runFeature({ kind: "check-ad-enable-batch", value: { requests: badReqs } });
    assert.equal(badOut.ok, false);
    assert.deepEqual(badOut.issues, ["bad-requests"]);
    assert.equal(badOut.value, null);
  });
  it("invalid kind returns bad-kind unknown", () => {
    const out = runFeature({ kind: "nope", value: {} });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-kind"]);
  });
  it("non-object payload returns bad-payload", () => {
    const out = runFeature(null);
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.deepEqual(out.issues, ["bad-payload"]);
  });
  it("single non-object value returns bad-value", () => {
    const out = runFeature({ kind: "check-ad-enable", value: null });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "check-ad-enable");
    assert.deepEqual(out.issues, ["bad-value"]);
  });
  it("batch bad requests returns bad-requests", () => {
    const out = runFeature({ kind: "check-ad-enable-batch", value: { requests: "x" } });
    assert.equal(out.ok, false);
    assert.deepEqual(out.issues, ["bad-requests"]);
    assert.equal(out.value, null);
  });
  it("preserves input and orders keys", () => {
    const input = { kind: "check-ad-enable", value: { adsEnabled: true, hasAdApi: true } };
    const snap = JSON.parse(JSON.stringify(input));
    const out = runFeature(input);
    assert.deepEqual(input, snap);
    assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
    assert.deepEqual(Object.keys(out.value), ["adsEnabled", "allowed", "attempted", "hasAdApi", "issues", "reason", "valid"]);
    const again = runFeature({ kind: "check-ad-enable", value: { adsEnabled: true, hasAdApi: true } });
    assert.deepEqual(out, again);
  });
});
