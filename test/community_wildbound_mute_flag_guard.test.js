import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_mute_flag_guard.mjs";

function keysOf(obj) {
  return Object.keys(obj);
}

describe("wildbound mute flag guard false-like", () => {
  it("null yields mutedState false valid true", () => {
    const out = runFeature({ kind: "check-mute-flag", value: { muted: null } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-mute-flag");
    assert.deepEqual(out.value, { issues: [], muted: null, mutedState: false, valid: true });
    assert.deepEqual(keysOf(out.value), ["issues", "muted", "mutedState", "valid"]);
  });
  it("false yields mutedState false", () => {
    const out = runFeature({ kind: "check-mute-flag", value: { muted: false } });
    assert.deepEqual(out.value, { issues: [], muted: false, mutedState: false, valid: true });
  });
  it("0 yields mutedState false", () => {
    const out = runFeature({ kind: "check-mute-flag", value: { muted: 0 } });
    assert.deepEqual(out.value, { issues: [], muted: 0, mutedState: false, valid: true });
  });
  it("empty string yields mutedState false", () => {
    const out = runFeature({ kind: "check-mute-flag", value: { muted: "" } });
    assert.deepEqual(out.value, { issues: [], muted: "", mutedState: false, valid: true });
  });
});

describe("wildbound mute flag guard true-like", () => {
  it("true yields mutedState true", () => {
    const out = runFeature({ kind: "check-mute-flag", value: { muted: true } });
    assert.deepEqual(out.value, { issues: [], muted: true, mutedState: true, valid: true });
  });
  it("nonzero safe numbers yield true", () => {
    for (const n of [1, -1, 42, 9007199254740991, -9007199254740991]) {
      const out = runFeature({ kind: "check-mute-flag", value: { muted: n } });
      assert.equal(out.value.valid, true);
      assert.equal(out.value.mutedState, true);
      assert.deepEqual(out.value.issues, []);
    }
  });
  it("non-empty safe strings yield true", () => {
    for (const s of ["on", "muted", " \t", "\n", "\r", "\t\n\r"]) {
      const out = runFeature({ kind: "check-mute-flag", value: { muted: s } });
      assert.equal(out.value.valid, true);
      assert.equal(out.value.mutedState, true);
    }
  });
});

describe("wildbound mute flag guard malformed muted", () => {
  it("object muted yields bad-mute-flag", () => {
    const out = runFeature({ kind: "check-mute-flag", value: { muted: { x: 1 } } });
    assert.equal(out.ok, true);
    assert.deepEqual(out.value, { issues: ["bad-mute-flag"], muted: null, mutedState: null, valid: false });
  });
  it("array muted yields bad-mute-flag with null echo", () => {
    const out = runFeature({ kind: "check-mute-flag", value: { muted: [1] } });
    assert.deepEqual(out.value.issues, ["bad-mute-flag"]);
    assert.equal(out.value.muted, null);
    assert.equal(out.value.mutedState, null);
    assert.equal(out.value.valid, false);
  });
  it("out of domain numbers yield bad-mute-flag", () => {
    for (const n of [9007199254740992, -9007199254740992, Infinity, NaN]) {
      const out = runFeature({ kind: "check-mute-flag", value: { muted: n } });
      assert.equal(out.ok, true);
      assert.equal(out.value.valid, false);
      assert.deepEqual(out.value.issues, ["bad-mute-flag"]);
      assert.equal(out.value.mutedState, null);
    }
  });
  it("out of domain strings yield bad-mute-flag", () => {
    const long = "a".repeat(33);
    const badControl = "\u0000";
    const lone = "\uD800";
    for (const s of [long, badControl, lone, "a\u0007b"]) {
      const out = runFeature({ kind: "check-mute-flag", value: { muted: s } });
      assert.equal(out.value.valid, false);
      assert.deepEqual(out.value.issues, ["bad-mute-flag"]);
    }
  });
  it("documented examples match", () => {
    assert.deepEqual(runFeature({ kind: "check-mute-flag", value: { muted: false } }), {
      kind: "check-mute-flag",
      ok: true,
      value: { issues: [], muted: false, mutedState: false, valid: true }
    });
    assert.deepEqual(runFeature({ kind: "check-mute-flag", value: { muted: "on" } }), {
      kind: "check-mute-flag",
      ok: true,
      value: { issues: [], muted: "on", mutedState: true, valid: true }
    });
  });
});

describe("wildbound mute flag guard batch", () => {
  it("evaluates each request independently in order", () => {
    const out = runFeature({
      kind: "check-mute-flag-batch",
      value: { requests: [{ muted: false }, { muted: "on" }, { muted: { x: 1 } }] }
    });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-mute-flag-batch");
    assert.equal(out.value.results.length, 3);
    assert.deepEqual(out.value.results[0], { issues: [], muted: false, mutedState: false, valid: true });
    assert.deepEqual(out.value.results[1], { issues: [], muted: "on", mutedState: true, valid: true });
    assert.deepEqual(out.value.results[2], { issues: ["bad-mute-flag"], muted: null, mutedState: null, valid: false });
    for (const r of out.value.results) {
      assert.deepEqual(Object.keys(r), ["issues", "muted", "mutedState", "valid"]);
    }
  });
  it("empty batch returns empty results", () => {
    const out = runFeature({ kind: "check-mute-flag-batch", value: { requests: [] } });
    assert.equal(out.ok, true);
    assert.deepEqual(out.value, { results: [] });
  });
});

describe("wildbound mute flag guard invalid envelope", () => {
  it("unknown kind returns ok false value null", () => {
    const out = runFeature({ kind: "nope", value: {} });
    assert.equal(out.ok, false);
    assert.equal(out.value, null);
    assert.equal(out.kind, "unknown");
    assert.equal(out.issues.length, 1);
    assert.ok(["bad-kind", "bad-payload", "bad-value", "bad-requests"].includes(out.issues[0]));
  });
  it("non-object payload returns bad-payload", () => {
    for (const p of [null, 42, "x", []]) {
      const out = runFeature(p);
      assert.equal(out.ok, false);
      assert.equal(out.value, null);
      assert.ok(["bad-kind", "bad-payload", "bad-value", "bad-requests"].includes(out.issues[0]));
    }
  });
  it("malformed single value returns ok false", () => {
    const out = runFeature({ kind: "check-mute-flag", value: {} });
    assert.equal(out.ok, false);
    assert.equal(out.value, null);
    assert.ok(["bad-kind", "bad-payload", "bad-value", "bad-requests"].includes(out.issues[0]));
  });
  it("malformed batch requests returns ok false", () => {
    const out = runFeature({ kind: "check-mute-flag-batch", value: { requests: "no" } });
    assert.equal(out.ok, false);
    assert.equal(out.value, null);
    assert.ok(["bad-kind", "bad-payload", "bad-value", "bad-requests"].includes(out.issues[0]));
  });
});

describe("wildbound mute flag guard purity", () => {
  it("preserves input and is deterministic with ordered keys", () => {
    const payload = { kind: "check-mute-flag", value: { muted: "on" } };
    const before = JSON.stringify(payload);
    const a = runFeature(payload);
    const b = runFeature(JSON.parse(before));
    assert.equal(JSON.stringify(payload), before);
    assert.deepEqual(a, b);
    assert.deepEqual(Object.keys(a), ["kind", "ok", "value"]);
    const err = runFeature({ kind: "bad", value: null });
    assert.deepEqual(Object.keys(err), ["issues", "kind", "ok", "value"]);
  });
});
