import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_local_score_guard.mjs";

describe("wildbound local score guard", () => {
  it("rounds 1.6 to 2", () => {
    const out = runFeature({ kind: "check-local-score", value: { score: 1.6 } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-local-score");
    assert.deepEqual(out.value.issues, []);
    assert.equal(out.value.normalized, 2);
    assert.equal(out.value.stored, "2");
    assert.equal(out.value.valid, true);
    assert.equal(out.value.raw, 1.6);
  });
  it("clamps negative to zero", () => {
    const out = runFeature({ kind: "check-local-score", value: { score: -4.2 } });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.normalized, 0);
    assert.equal(out.value.stored, "0");
    assert.deepEqual(out.value.issues, []);
  });
  it("matches Number coercion for string boolean null", () => {
    const a = runFeature({ kind: "check-local-score", value: { score: "42.4" } });
    assert.equal(a.value.normalized, 42);
    assert.equal(a.value.stored, "42");
    assert.equal(a.value.valid, true);
    const b = runFeature({ kind: "check-local-score", value: { score: true } });
    assert.equal(b.value.normalized, 1);
    assert.equal(b.value.stored, "1");
    const c = runFeature({ kind: "check-local-score", value: { score: null } });
    assert.equal(c.value.normalized, 0);
    assert.equal(c.value.stored, "0");
    assert.equal(c.value.valid, true);
  });
  it("flags object score as bad-score", () => {
    const out = runFeature({ kind: "check-local-score", value: { score: { x: 1 } } });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.normalized, null);
    assert.equal(out.value.stored, null);
    assert.equal(out.value.raw, null);
    assert.deepEqual(out.value.issues, ["bad-score"]);
  });
  it("evaluates batch in order", () => {
    const out = runFeature({ kind: "check-local-score-batch", value: { requests: [{ score: 1.6 }, { score: -4.2 }, { score: { x: 1 } }] } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-local-score-batch");
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].normalized, 2);
    assert.equal(out.value.results[0].valid, true);
    assert.equal(out.value.results[1].normalized, 0);
    assert.equal(out.value.results[1].valid, true);
    assert.equal(out.value.results[2].valid, false);
    assert.deepEqual(out.value.results[2].issues, ["bad-score"]);
  });
  it("rejects unknown kind", () => {
    const out = runFeature({ kind: "nope", value: {} });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-kind"]);
  });
});
