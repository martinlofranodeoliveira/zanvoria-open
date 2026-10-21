import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_leaderboard_submit_guard.mjs";

describe("wildbound leaderboard submit guard single", () => {
  it("all flags true submits", () => {
    const out = runFeature({ kind: "check-leaderboard-submit", value: { hasKey: true, hasSubmitApi: true, usingCrazyGames: true } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-leaderboard-submit");
    assert.deepEqual(out.value, { hasKey: true, hasSubmitApi: true, issues: [], reason: null, submitted: true, usingCrazyGames: true, valid: true });
    assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
    assert.deepEqual(Object.keys(out.value), ["hasKey", "hasSubmitApi", "issues", "reason", "submitted", "usingCrazyGames", "valid"]);
  });
  it("any flag false does not submit", () => {
    const out = runFeature({ kind: "check-leaderboard-submit", value: { hasKey: true, hasSubmitApi: true, usingCrazyGames: false } });
    assert.equal(out.ok, true);
    assert.equal(out.value.submitted, false);
    assert.equal(out.value.reason, "leaderboard-not-configured");
    assert.equal(out.value.valid, true);
    assert.deepEqual(out.value.issues, []);
  });
  it("missing key flag does not submit", () => {
    const out = runFeature({ kind: "check-leaderboard-submit", value: { hasKey: false, hasSubmitApi: true, usingCrazyGames: true } });
    assert.equal(out.value.submitted, false);
    assert.equal(out.value.reason, "leaderboard-not-configured");
    assert.equal(out.value.valid, true);
  });
  it("malformed flags return deterministic issues", () => {
    const out = runFeature({ kind: "check-leaderboard-submit", value: { hasKey: "x", hasSubmitApi: 1, usingCrazyGames: null } });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.submitted, false);
    assert.equal(out.value.reason, null);
    assert.deepEqual(out.value.issues, ["bad-key-flag", "bad-api-flag", "bad-sdk-flag"]);
    assert.equal(out.value.hasKey, null);
    assert.equal(out.value.hasSubmitApi, null);
    assert.equal(out.value.usingCrazyGames, null);
  });
  it("single bad sdk flag only", () => {
    const out = runFeature({ kind: "check-leaderboard-submit", value: { hasKey: true, hasSubmitApi: true, usingCrazyGames: { x: 1 } } });
    assert.deepEqual(out.value.issues, ["bad-sdk-flag"]);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.usingCrazyGames, null);
  });
});

describe("wildbound leaderboard submit guard batch", () => {
  it("evaluates each request in order", () => {
    const out = runFeature({ kind: "check-leaderboard-submit-batch", value: { requests: [{ hasKey: true, hasSubmitApi: true, usingCrazyGames: true }, { hasKey: true, hasSubmitApi: false, usingCrazyGames: true }, { hasKey: 0, hasSubmitApi: true, usingCrazyGames: true }] } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-leaderboard-submit-batch");
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].submitted, true);
    assert.equal(out.value.results[0].valid, true);
    assert.equal(out.value.results[1].submitted, false);
    assert.equal(out.value.results[1].reason, "leaderboard-not-configured");
    assert.deepEqual(out.value.results[2].issues, ["bad-key-flag"]);
    assert.equal(out.value.results[2].valid, false);
    for (const r of out.value.results) {
      assert.deepEqual(Object.keys(r), ["hasKey", "hasSubmitApi", "issues", "reason", "submitted", "usingCrazyGames", "valid"]);
    }
  });
  it("empty batch succeeds", () => {
    const out = runFeature({ kind: "check-leaderboard-submit-batch", value: { requests: [] } });
    assert.equal(out.ok, true);
    assert.deepEqual(out.value.results, []);
  });
});

describe("wildbound leaderboard submit guard errors", () => {
  it("unknown kind returns bad-kind", () => {
    const out = runFeature({ kind: "nope", value: {} });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-kind"]);
    assert.deepEqual(Object.keys(out), ["issues", "kind", "ok", "value"]);
  });
  it("non object payload returns bad-payload", () => {
    const out = runFeature(null);
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.deepEqual(out.issues, ["bad-payload"]);
  });
  it("bad single value returns bad-value", () => {
    const out = runFeature({ kind: "check-leaderboard-submit", value: { hasKey: true } });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "check-leaderboard-submit");
    assert.deepEqual(out.issues, ["bad-value"]);
  });
  it("bad batch requests returns bad-requests", () => {
    const out = runFeature({ kind: "check-leaderboard-submit-batch", value: { requests: "x" } });
    assert.equal(out.ok, false);
    assert.deepEqual(out.issues, ["bad-requests"]);
  });
  it("is pure deterministic and preserves input", () => {
    const payload = { kind: "check-leaderboard-submit", value: { hasKey: true, hasSubmitApi: true, usingCrazyGames: true } };
    const before = JSON.stringify(payload);
    const a = runFeature(payload);
    const b = runFeature(JSON.parse(before));
    assert.deepEqual(a, b);
    assert.equal(JSON.stringify(payload), before);
    assert.deepEqual(Object.keys(a.value), ["hasKey", "hasSubmitApi", "issues", "reason", "submitted", "usingCrazyGames", "valid"]);
  });
});
