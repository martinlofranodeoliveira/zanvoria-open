import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature, checkHonestScope, checkHonestScopeBatch } from "../js/community/wildbound_honest_scope_guard.mjs";

const VALUE_KEYS = ["cloudLeaderboard", "honest", "issues", "productionDeploy", "reason", "sdkDownload", "valid"];
const TOP_OK_KEYS = ["kind", "ok", "value"];
const TOP_ERR_KEYS = ["issues", "kind", "ok", "value"];

describe("wildbound honest scope guard", () => {
  it("well-formed all-false is honest", () => {
    const out = runFeature({ kind: "check-honest-scope", value: { cloudLeaderboard: false, productionDeploy: false, sdkDownload: false } });
    assert.deepEqual(out, { kind: "check-honest-scope", ok: true, value: { cloudLeaderboard: false, honest: true, issues: [], productionDeploy: false, reason: null, sdkDownload: false, valid: true } });
    assert.deepEqual(Object.keys(out), TOP_OK_KEYS);
    assert.deepEqual(Object.keys(out.value), VALUE_KEYS);
  });
  it("well-formed any-true is dishonest", () => {
    const a = runFeature({ kind: "check-honest-scope", value: { cloudLeaderboard: true, productionDeploy: false, sdkDownload: false } });
    assert.equal(a.ok, true);
    assert.equal(a.value.valid, true);
    assert.equal(a.value.honest, false);
    assert.equal(a.value.reason, "dishonest-claim");
    assert.deepEqual(a.value.issues, []);
    const b = runFeature({ kind: "check-honest-scope", value: { cloudLeaderboard: false, productionDeploy: true, sdkDownload: false } });
    assert.equal(b.value.honest, false);
    assert.equal(b.value.reason, "dishonest-claim");
    const c = runFeature({ kind: "check-honest-scope", value: { cloudLeaderboard: false, productionDeploy: false, sdkDownload: true } });
    assert.equal(c.value.honest, false);
    assert.equal(c.value.reason, "dishonest-claim");
    const d = runFeature({ kind: "check-honest-scope", value: { cloudLeaderboard: true, productionDeploy: true, sdkDownload: true } });
    assert.equal(d.value.honest, false);
    assert.deepEqual(Object.keys(d.value), VALUE_KEYS);
  });
  it("malformed flags return valid false with deterministic issues", () => {
    const one = runFeature({ kind: "check-honest-scope", value: { cloudLeaderboard: "yes", productionDeploy: false, sdkDownload: false } });
    assert.deepEqual(one, { kind: "check-honest-scope", ok: true, value: { cloudLeaderboard: null, honest: null, issues: ["bad-cloud-flag"], productionDeploy: false, reason: null, sdkDownload: false, valid: false } });
    const two = runFeature({ kind: "check-honest-scope", value: { cloudLeaderboard: false, productionDeploy: 1, sdkDownload: null } });
    assert.deepEqual(two.value.issues, ["bad-deploy-flag", "bad-sdk-flag"]);
    assert.equal(two.value.valid, false);
    assert.equal(two.value.honest, null);
    assert.equal(two.value.reason, null);
    const all = runFeature({ kind: "check-honest-scope", value: { cloudLeaderboard: 0, productionDeploy: "x", sdkDownload: 1 } });
    assert.deepEqual(all.value.issues, ["bad-cloud-flag", "bad-deploy-flag", "bad-sdk-flag"]);
    assert.deepEqual(Object.keys(all.value), VALUE_KEYS);
  });
  it("batch 0 to 16 evaluates independently in order", () => {
    const empty = runFeature({ kind: "check-honest-scope-batch", value: { requests: [] } });
    assert.equal(empty.ok, true);
    assert.deepEqual(empty.value, { results: [] });
    const mixed = runFeature({ kind: "check-honest-scope-batch", value: { requests: [{ cloudLeaderboard: false, productionDeploy: false, sdkDownload: false }, { cloudLeaderboard: true, productionDeploy: false, sdkDownload: false }, { cloudLeaderboard: "bad", productionDeploy: false, sdkDownload: false }] } });
    assert.equal(mixed.ok, true);
    assert.equal(mixed.value.results.length, 3);
    assert.equal(mixed.value.results[0].honest, true);
    assert.equal(mixed.value.results[1].honest, false);
    assert.equal(mixed.value.results[2].valid, false);
    assert.deepEqual(mixed.value.results[2].issues, ["bad-cloud-flag"]);
    for (const r of mixed.value.results) {
      assert.deepEqual(Object.keys(r), VALUE_KEYS);
    }
    const sixteen = [];
    for (let i = 0; i < 16; i++) {
      sixteen.push({ cloudLeaderboard: false, productionDeploy: false, sdkDownload: false });
    }
    const full = runFeature({ kind: "check-honest-scope-batch", value: { requests: sixteen } });
    assert.equal(full.ok, true);
    assert.equal(full.value.results.length, 16);
  });
  it("invalid kind payload and malformed values return ok false", () => {
    const badKind = runFeature({ kind: "nope", value: {} });
    assert.deepEqual(badKind, { issues: ["bad-kind"], kind: "unknown", ok: false, value: null });
    assert.deepEqual(Object.keys(badKind), TOP_ERR_KEYS);
    const missingKind = runFeature({ value: {} });
    assert.deepEqual(missingKind.issues, ["bad-kind"]);
    assert.equal(missingKind.kind, "unknown");
    for (const bad of [null, 42, "x", [], true]) {
      const out = runFeature(bad);
      assert.deepEqual(out, { issues: ["bad-payload"], kind: "unknown", ok: false, value: null });
    }
    const badValue = runFeature({ kind: "check-honest-scope", value: { cloudLeaderboard: false } });
    assert.deepEqual(badValue, { issues: ["bad-value"], kind: "check-honest-scope", ok: false, value: null });
    const extraKey = runFeature({ kind: "check-honest-scope", value: { cloudLeaderboard: false, productionDeploy: false, sdkDownload: false, extra: 1 } });
    assert.deepEqual(extraKey.issues, ["bad-value"]);
    const badReq = runFeature({ kind: "check-honest-scope-batch", value: { requests: "no" } });
    assert.deepEqual(badReq, { issues: ["bad-requests"], kind: "check-honest-scope-batch", ok: false, value: null });
    const tooMany = [];
    for (let i = 0; i < 17; i++) {
      tooMany.push({ cloudLeaderboard: false, productionDeploy: false, sdkDownload: false });
    }
    const over = runFeature({ kind: "check-honest-scope-batch", value: { requests: tooMany } });
    assert.deepEqual(over.issues, ["bad-requests"]);
    const badElem = runFeature({ kind: "check-honest-scope-batch", value: { requests: [{ cloudLeaderboard: false }] } });
    assert.deepEqual(badElem.issues, ["bad-requests"]);
  });
  it("is pure deterministic and preserves input with alphabetical keys", () => {
    const input = { kind: "check-honest-scope", value: { cloudLeaderboard: false, productionDeploy: true, sdkDownload: false } };
    const snap = JSON.stringify(input);
    const first = runFeature(input);
    const second = runFeature(JSON.parse(snap));
    assert.deepEqual(first, second);
    assert.equal(JSON.stringify(input), snap);
    assert.deepEqual(Object.keys(first), TOP_OK_KEYS);
    assert.deepEqual(Object.keys(first.value), VALUE_KEYS);
    const batchIn = { kind: "check-honest-scope-batch", value: { requests: [{ cloudLeaderboard: false, productionDeploy: false, sdkDownload: false }] } };
    const batchSnap = JSON.stringify(batchIn);
    runFeature(batchIn);
    assert.equal(JSON.stringify(batchIn), batchSnap);
  });
  it("helpers are pure functions", () => {
    const r = checkHonestScope({ cloudLeaderboard: false, productionDeploy: false, sdkDownload: false });
    assert.equal(r.honest, true);
    assert.deepEqual(Object.keys(r), VALUE_KEYS);
    const arr = checkHonestScopeBatch({ requests: [{ cloudLeaderboard: false, productionDeploy: false, sdkDownload: false }] });
    assert.equal(Array.isArray(arr), true);
    assert.equal(arr.length, 1);
  });
});
