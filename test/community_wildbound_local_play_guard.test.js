import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature, checkLocalPlay, checkLocalPlayBatch } from "../js/community/wildbound_local_play_guard.mjs";

const ORDER = ["advertisesLocalGameplay", "advertisesLocalScores", "advertisesNoCloudLeaderboard", "advertisesNoSdkDownload", "complete", "issues", "valid"];

function allTrueValue() {
  return {
    advertisesLocalGameplay: true,
    advertisesLocalScores: true,
    advertisesNoCloudLeaderboard: true,
    advertisesNoSdkDownload: true
  };
}

describe("wildbound local play guard", () => {
  it("all-true claim returns valid complete with empty issues", () => {
    const out = runFeature({ kind: "check-local-play", value: allTrueValue() });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-local-play");
    assert.equal(out.value.valid, true);
    assert.equal(out.value.complete, true);
    assert.deepEqual(out.value.issues, []);
    assert.deepEqual(Object.keys(out.value), ORDER);
    assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
  });

  it("false flags return missing-* issues in deterministic order", () => {
    const out = runFeature({
      kind: "check-local-play",
      value: {
        advertisesLocalGameplay: false,
        advertisesLocalScores: true,
        advertisesNoCloudLeaderboard: false,
        advertisesNoSdkDownload: false
      }
    });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.complete, false);
    assert.deepEqual(out.value.issues, ["missing-local-gameplay", "missing-no-cloud-leaderboard", "missing-no-sdk-download"]);
    assert.deepEqual(Object.keys(out.value), ORDER);
  });

  it("single false example maps to missing-no-cloud-leaderboard", () => {
    const out = runFeature({
      kind: "check-local-play",
      value: { advertisesLocalGameplay: true, advertisesLocalScores: true, advertisesNoCloudLeaderboard: false, advertisesNoSdkDownload: true }
    });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.complete, false);
    assert.deepEqual(out.value.issues, ["missing-no-cloud-leaderboard"]);
  });

  it("malformed flag type returns valid false with null echo and bad-* issues", () => {
    const out = runFeature({
      kind: "check-local-play",
      value: { advertisesLocalGameplay: true, advertisesLocalScores: "yes", advertisesNoCloudLeaderboard: true, advertisesNoSdkDownload: true }
    });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-local-play");
    assert.equal(out.value.valid, false);
    assert.equal(out.value.complete, false);
    assert.equal(out.value.advertisesLocalScores, null);
    assert.equal(out.value.advertisesLocalGameplay, true);
    assert.deepEqual(out.value.issues, ["bad-local-scores"]);
    assert.deepEqual(Object.keys(out.value), ORDER);
  });

  it("multiple malformed flags keep deterministic bad-* order", () => {
    const out = runFeature({
      kind: "check-local-play",
      value: { advertisesLocalGameplay: 1, advertisesLocalScores: null, advertisesNoCloudLeaderboard: true, advertisesNoSdkDownload: 0 }
    });
    assert.equal(out.value.valid, false);
    assert.deepEqual(out.value.issues, ["bad-local-gameplay", "bad-local-scores", "bad-no-sdk-download"]);
    assert.equal(out.value.advertisesLocalGameplay, null);
    assert.equal(out.value.advertisesLocalScores, null);
  });

  it("batch evaluates each independently in order", () => {
    const out = runFeature({
      kind: "check-local-play-batch",
      value: {
        requests: [
          allTrueValue(),
          { advertisesLocalGameplay: false, advertisesLocalScores: false, advertisesNoCloudLeaderboard: false, advertisesNoSdkDownload: false },
          { advertisesLocalGameplay: true, advertisesLocalScores: "x", advertisesNoCloudLeaderboard: true, advertisesNoSdkDownload: true }
        ]
      }
    });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-local-play-batch");
    assert.equal(out.value.results.length, 3);
    assert.deepEqual(out.value.results[0].issues, []);
    assert.equal(out.value.results[0].complete, true);
    assert.deepEqual(out.value.results[1].issues, ["missing-local-gameplay", "missing-local-scores", "missing-no-cloud-leaderboard", "missing-no-sdk-download"]);
    assert.deepEqual(out.value.results[2].issues, ["bad-local-scores"]);
    assert.equal(out.value.results[2].valid, false);
    for (const r of out.value.results) {
      assert.deepEqual(Object.keys(r), ORDER);
    }
  });

  it("empty batch returns empty results", () => {
    const out = runFeature({ kind: "check-local-play-batch", value: { requests: [] } });
    assert.equal(out.ok, true);
    assert.deepEqual(out.value.results, []);
  });

  it("unknown kind returns ok false with bad-kind", () => {
    const out = runFeature({ kind: "nope", value: {} });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-kind"]);
  });

  it("non-object payload returns ok false with bad-payload", () => {
    const out = runFeature(null);
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-payload"]);
  });

  it("malformed single value returns bad-value", () => {
    const out = runFeature({ kind: "check-local-play", value: { advertisesLocalGameplay: true } });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "check-local-play");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-value"]);
  });

  it("malformed batch value returns single bad-value/bad-requests issue", () => {
    const over = [];
    for (let i = 0; i < 17; i++) {
      over.push(allTrueValue());
    }
    const out = runFeature({ kind: "check-local-play-batch", value: { requests: over } });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "check-local-play-batch");
    assert.equal(out.value, null);
    assert.equal(out.issues.length, 1);
    assert.ok(out.issues[0] === "bad-requests" || out.issues[0] === "bad-value");
  });

  it("helpers are pure and preserve input", () => {
    const v = allTrueValue();
    const snap = JSON.stringify(v);
    const one = checkLocalPlay(v);
    assert.equal(one.valid, true);
    assert.equal(JSON.stringify(v), snap);
    const b = checkLocalPlayBatch({ requests: [v] });
    assert.equal(b.results.length, 1);
    assert.equal(JSON.stringify(v), snap);
  });
});
