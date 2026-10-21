import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_ad_request_guard.mjs";

const SINGLE_ORDER = ["adsEnabled", "blockReason", "hasAdApi", "issues", "reason", "requested", "usingCrazyGames", "valid"];

function assertOrdered(obj, expected) {
  assert.deepEqual(Object.keys(obj), expected);
}

describe("wildbound ad request guard", () => {
  it("all flags true with midgame requests ad", () => {
    const input = { kind: "check-ad-request", value: { adsEnabled: true, hasAdApi: true, reason: "midgame", usingCrazyGames: true } };
    const snapshot = JSON.parse(JSON.stringify(input));
    const out = runFeature(input);
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-ad-request");
    assertOrdered(out, ["kind", "ok", "value"]);
    assertOrdered(out.value, SINGLE_ORDER);
    assert.deepEqual(out.value, { adsEnabled: true, blockReason: null, hasAdApi: true, issues: [], reason: "midgame", requested: true, usingCrazyGames: true, valid: true });
    assert.deepEqual(input, snapshot);
    assert.deepEqual(runFeature(input), out);
  });
  it("adsEnabled false blocks with ad-not-available", () => {
    const out = runFeature({ kind: "check-ad-request", value: { adsEnabled: false, hasAdApi: true, reason: "midgame", usingCrazyGames: true } });
    assert.equal(out.ok, true);
    assertOrdered(out.value, SINGLE_ORDER);
    assert.equal(out.value.valid, true);
    assert.deepEqual(out.value.issues, []);
    assert.equal(out.value.requested, false);
    assert.equal(out.value.blockReason, "ad-not-available");
  });
  it("malformed object reason is invalid with bad-ad-reason", () => {
    const out = runFeature({ kind: "check-ad-request", value: { adsEnabled: true, hasAdApi: true, reason: { x: 1 }, usingCrazyGames: true } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-ad-request");
    assertOrdered(out.value, SINGLE_ORDER);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.requested, false);
    assert.equal(out.value.blockReason, null);
    assert.equal(out.value.reason, null);
    assert.deepEqual(out.value.issues, ["bad-ad-reason"]);
  });
  it("batch evaluates independently in order", () => {
    const input = { kind: "check-ad-request-batch", value: { requests: [{ adsEnabled: true, hasAdApi: true, reason: "midgame", usingCrazyGames: true }, { adsEnabled: false, hasAdApi: true, reason: "menu", usingCrazyGames: true }] } };
    const out = runFeature(input);
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-ad-request-batch");
    assertOrdered(out, ["kind", "ok", "value"]);
    assert.deepEqual(Object.keys(out.value), ["results"]);
    assert.equal(out.value.results.length, 2);
    for (const r of out.value.results) {
      assertOrdered(r, SINGLE_ORDER);
    }
    assert.equal(out.value.results[0].requested, true);
    assert.equal(out.value.results[0].valid, true);
    assert.equal(out.value.results[1].requested, false);
    assert.equal(out.value.results[1].blockReason, "ad-not-available");
  });
  it("unknown kind and bad payloads return ok false", () => {
    const a = runFeature({ kind: "nope", value: null });
    assert.equal(a.ok, false);
    assert.equal(a.kind, "unknown");
    assert.equal(a.value, null);
    assert.deepEqual(a.issues, ["bad-kind"]);
    assertOrdered(a, ["issues", "kind", "ok", "value"]);
    const b = runFeature(null);
    assert.deepEqual(b.issues, ["bad-payload"]);
    assert.equal(b.kind, "unknown");
    assert.equal(b.value, null);
    const c = runFeature({ kind: "check-ad-request", value: { adsEnabled: true } });
    assert.equal(c.ok, false);
    assert.equal(c.kind, "check-ad-request");
    assert.deepEqual(c.issues, ["bad-value"]);
    assert.equal(c.value, null);
    const d = runFeature({ kind: "check-ad-request-batch", value: { requests: "no" } });
    assert.equal(d.ok, false);
    assert.equal(d.kind, "check-ad-request-batch");
    assert.deepEqual(d.issues, ["bad-requests"]);
  });
  it("pure deterministic ordered and preserves input", () => {
    const input = { kind: "check-ad-request", value: { adsEnabled: true, hasAdApi: false, reason: "mid-game", usingCrazyGames: true } };
    const copy = JSON.parse(JSON.stringify(input));
    const first = runFeature(input);
    const second = runFeature(JSON.parse(JSON.stringify(copy)));
    assert.deepEqual(first, second);
    assert.deepEqual(input, copy);
    assertOrdered(first, ["kind", "ok", "value"]);
    assertOrdered(first.value, SINGLE_ORDER);
    assert.equal(first.value.requested, false);
    assert.equal(first.value.blockReason, "ad-not-available");
    assert.equal(first.value.valid, true);
  });
});
