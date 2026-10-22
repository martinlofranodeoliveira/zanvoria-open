import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_lifecycle_phase_guard.mjs";
import * as guard from "../js/community/wildbound_lifecycle_phase_guard.mjs";
function keysOf(v) {
  return Object.keys(v);
}
function expectAlpha(v, expected) {
  assert.deepEqual(keysOf(v), expected);
  assert.deepEqual([...keysOf(v)].sort(), expected);
}
 describe("wildbound lifecycle phase guard", () => {
  it("loadingStart returns allowed loading", () => {
    const out = runFeature({ kind: "check-lifecycle-phase", value: { event: "loadingStart" } });
    assert.deepEqual(out, { kind: "check-lifecycle-phase", ok: true, value: { allowed: true, event: "loadingStart", issues: [], phase: "loading", reason: null, valid: true } });
    expectAlpha(out, ["kind", "ok", "value"]);
    expectAlpha(out.value, ["allowed", "event", "issues", "phase", "reason", "valid"]);
  });
  it("loadingStop returns allowed loading", () => {
    const out = runFeature({ kind: "check-lifecycle-phase", value: { event: "loadingStop" } });
    assert.equal(out.ok, true);
    assert.equal(out.value.allowed, true);
    assert.equal(out.value.phase, "loading");
    assert.equal(out.value.reason, null);
    assert.equal(out.value.valid, true);
    assert.deepEqual(out.value.issues, []);
  });
  it("gameplayStart returns allowed gameplay", () => {
    const out = runFeature({ kind: "check-lifecycle-phase", value: { event: "gameplayStart" } });
    assert.deepEqual(out.value, { allowed: true, event: "gameplayStart", issues: [], phase: "gameplay", reason: null, valid: true });
  });
  it("gameplayStop returns allowed gameplay", () => {
    const out = runFeature({ kind: "check-lifecycle-phase", value: { event: "gameplayStop" } });
    assert.deepEqual(out, { kind: "check-lifecycle-phase", ok: true, value: { allowed: true, event: "gameplayStop", issues: [], phase: "gameplay", reason: null, valid: true } });
  });
  it("well-formed unlisted returns unlisted-event", () => {
    const out = runFeature({ kind: "check-lifecycle-phase", value: { event: "Pause" } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-lifecycle-phase");
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.phase, null);
    assert.equal(out.value.reason, "unlisted-event");
    assert.equal(out.value.valid, true);
    assert.deepEqual(out.value.issues, []);
    assert.equal(out.value.event, "Pause");
    expectAlpha(out.value, ["allowed", "event", "issues", "phase", "reason", "valid"]);
  });
  it("malformed non-string event returns bad-event with null echo", () => {
    const out = runFeature({ kind: "check-lifecycle-phase", value: { event: { x: 1 } } });
    assert.deepEqual(out, { kind: "check-lifecycle-phase", ok: true, value: { allowed: false, event: null, issues: ["bad-event"], phase: null, reason: null, valid: false } });
  });
  it("malformed string events return bad-event with echo", () => {
    for (const ev of ["", "a1", "hi!", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]) {
      const out = runFeature({ kind: "check-lifecycle-phase", value: { event: ev } });
      assert.equal(out.value.valid, false);
      assert.deepEqual(out.value.issues, ["bad-event"]);
      assert.equal(out.value.allowed, false);
      assert.equal(out.value.phase, null);
      assert.equal(out.value.event, ev);
    }
  });
  it("batch evaluates in order including empty and mixed", () => {
    const empty = runFeature({ kind: "check-lifecycle-phase-batch", value: { requests: [] } });
    assert.deepEqual(empty, { kind: "check-lifecycle-phase-batch", ok: true, value: { results: [] } });
    expectAlpha(empty, ["kind", "ok", "value"]);
    assert.deepEqual(keysOf(empty.value), ["results"]);
    const mixed = runFeature({ kind: "check-lifecycle-phase-batch", value: { requests: [{ event: "loadingStart" }, { event: "Pause" }, { event: 7 }] } });
    assert.equal(mixed.ok, true);
    assert.equal(mixed.value.results.length, 3);
    assert.equal(mixed.value.results[0].phase, "loading");
    assert.equal(mixed.value.results[0].allowed, true);
    assert.equal(mixed.value.results[1].reason, "unlisted-event");
    assert.equal(mixed.value.results[1].valid, true);
    assert.deepEqual(mixed.value.results[2].issues, ["bad-event"]);
    assert.equal(mixed.value.results[2].valid, false);
    for (const r of mixed.value.results) {
      expectAlpha(r, ["allowed", "event", "issues", "phase", "reason", "valid"]);
    }
  });
  it("batch rejects too many and malformed items", () => {
    const many = [];
    for (let i = 0; i < 17; i++) many.push({ event: "Pause" });
    const tooMany = runFeature({ kind: "check-lifecycle-phase-batch", value: { requests: many } });
    assert.equal(tooMany.ok, false);
    assert.deepEqual(tooMany.issues, ["bad-requests"]);
    assert.equal(tooMany.value, null);
    const badItem = runFeature({ kind: "check-lifecycle-phase-batch", value: { requests: [{ event: "loadingStart" }, { nope: 1 }] } });
    assert.equal(badItem.ok, false);
    assert.deepEqual(badItem.issues, ["bad-requests"]);
    const badReqType = runFeature({ kind: "check-lifecycle-phase-batch", value: { requests: "nope" } });
    assert.equal(badReqType.ok, false);
    assert.deepEqual(badReqType.issues, ["bad-requests"]);
  });
  it("invalid kind payload value map to single issues", () => {
    const a = runFeature({ kind: "nope", value: {} });
    assert.deepEqual(a, { issues: ["bad-kind"], kind: "unknown", ok: false, value: null });
    expectAlpha(a, ["issues", "kind", "ok", "value"]);
    const b = runFeature(null);
    assert.deepEqual(b.issues, ["bad-payload"]);
    assert.equal(b.kind, "unknown");
    const c = runFeature({ kind: "check-lifecycle-phase", value: {} });
    assert.deepEqual(c.issues, ["bad-value"]);
    assert.equal(c.kind, "check-lifecycle-phase");
    const d = runFeature({ kind: "check-lifecycle-phase-batch", value: {} });
    assert.deepEqual(d.issues, ["bad-value"]);
    const e = runFeature({ kind: "check-lifecycle-phase", value: { event: "loadingStart", extra: 1 } });
    assert.deepEqual(e.issues, ["bad-value"]);
    const f = runFeature("str");
    assert.deepEqual(f.issues, ["bad-payload"]);
  });
  it("preserves input and is deterministic with alpha keys", () => {
    const input = { kind: "check-lifecycle-phase-batch", value: { requests: [{ event: "gameplayStop" }, { event: "loadingStop" }] } };
    const snap = JSON.stringify(input);
    const first = runFeature(input);
    const second = runFeature(JSON.parse(snap));
    assert.equal(JSON.stringify(input), snap);
    assert.deepEqual(first, second);
    assert.deepEqual(JSON.parse(JSON.stringify(first)), first);
    expectAlpha(first, ["kind", "ok", "value"]);
  });
  it("exposes runFeature and optional helpers", () => {
    assert.equal(typeof runFeature, "function");
    assert.equal(typeof guard.runFeature, "function");
    if (guard.checkLifecyclePhase !== undefined) assert.equal(typeof guard.checkLifecyclePhase, "function");
    if (guard.checkLifecyclePhaseBatch !== undefined) assert.equal(typeof guard.checkLifecyclePhaseBatch, "function");
  });
});
