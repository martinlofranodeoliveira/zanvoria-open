import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_platform_init_guard.mjs";

const singleKeys = ["allowed", "initialized", "issues", "mode", "reason", "usingCrazyGames", "valid"];
const topOkKeys = ["kind", "ok", "value"];
const topErrKeys = ["issues", "kind", "ok", "value"];

describe("wildbound platform init guard single well-formed", () => {
  it("uninitialized false false returns allowed true", () => {
    const out = runFeature({ kind: "check-platform-init", value: { initialized: false, usingCrazyGames: false } });
    assert.deepEqual(out, { kind: "check-platform-init", ok: true, value: { allowed: true, initialized: false, issues: [], mode: "uninitialized", reason: null, usingCrazyGames: false, valid: true } });
    assert.deepEqual(Object.keys(out), topOkKeys);
    assert.deepEqual(Object.keys(out.value), singleKeys);
  });
  it("local-fallback true false", () => {
    const out = runFeature({ kind: "check-platform-init", value: { initialized: true, usingCrazyGames: false } });
    assert.equal(out.ok, true);
    assert.equal(out.value.allowed, true);
    assert.equal(out.value.mode, "local-fallback");
    assert.equal(out.value.reason, null);
    assert.equal(out.value.valid, true);
    assert.deepEqual(out.value.issues, []);
  });
  it("crazygames true true", () => {
    const out = runFeature({ kind: "check-platform-init", value: { initialized: true, usingCrazyGames: true } });
    assert.deepEqual(out, { kind: "check-platform-init", ok: true, value: { allowed: true, initialized: true, issues: [], mode: "crazygames", reason: null, usingCrazyGames: true, valid: true } });
  });
  it("inconsistent false true returns allowed false", () => {
    const out = runFeature({ kind: "check-platform-init", value: { initialized: false, usingCrazyGames: true } });
    assert.deepEqual(out, { kind: "check-platform-init", ok: true, value: { allowed: false, initialized: false, issues: [], mode: null, reason: "inconsistent-flags", usingCrazyGames: true, valid: true } });
  });
});

describe("malformed flags valid false deterministic", () => {
  it("bad-initialized single", () => {
    const out = runFeature({ kind: "check-platform-init", value: { initialized: "yes", usingCrazyGames: false } });
    assert.deepEqual(out, { kind: "check-platform-init", ok: true, value: { allowed: false, initialized: null, issues: ["bad-initialized"], mode: null, reason: null, usingCrazyGames: false, valid: false } });
  });
  it("bad-using-crazy-games single echoes", () => {
    const out = runFeature({ kind: "check-platform-init", value: { initialized: true, usingCrazyGames: 1 } });
    assert.equal(out.value.valid, false);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.mode, null);
    assert.deepEqual(out.value.issues, ["bad-using-crazy-games"]);
    assert.equal(out.value.initialized, true);
    assert.equal(out.value.usingCrazyGames, null);
  });
  it("both bad in deterministic order", () => {
    const out = runFeature({ kind: "check-platform-init", value: { initialized: null, usingCrazyGames: "x" } });
    assert.deepEqual(out.value.issues, ["bad-initialized", "bad-using-crazy-games"]);
    assert.equal(out.value.initialized, null);
    assert.equal(out.value.usingCrazyGames, null);
    assert.equal(out.value.valid, false);
    assert.deepEqual(Object.keys(out.value), singleKeys);
  });
});

describe("batch evaluates independently in order", () => {
  it("empty batch returns empty results", () => {
    const out = runFeature({ kind: "check-platform-init-batch", value: { requests: [] } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-platform-init-batch");
    assert.deepEqual(out.value, { results: [] });
  });
  it("batch preserves order and seven keys", () => {
    const payload = { kind: "check-platform-init-batch", value: { requests: [{ initialized: false, usingCrazyGames: false }, { initialized: true, usingCrazyGames: true }, { initialized: false, usingCrazyGames: true }, { initialized: true, usingCrazyGames: "bad" }] } };
    const out = runFeature(payload);
    assert.equal(out.ok, true);
    assert.equal(out.value.results.length, 4);
    assert.equal(out.value.results[0].mode, "uninitialized");
    assert.equal(out.value.results[1].mode, "crazygames");
    assert.equal(out.value.results[2].reason, "inconsistent-flags");
    assert.equal(out.value.results[3].valid, false);
    assert.deepEqual(out.value.results[3].issues, ["bad-using-crazy-games"]);
    for (const r of out.value.results) {
      assert.deepEqual(Object.keys(r), singleKeys);
    }
  });
  it("batch rejects too many requests", () => {
    const requests = [];
    for (let i = 0; i < 17; i++) requests.push({ initialized: false, usingCrazyGames: false });
    const out = runFeature({ kind: "check-platform-init-batch", value: { requests } });
    assert.equal(out.ok, false);
    assert.deepEqual(out.issues, ["bad-requests"]);
    assert.equal(out.value, null);
  });
});

describe("invalid kind payload value errors", () => {
  it("unknown kind returns bad-kind with unknown", () => {
    const out = runFeature({ kind: "nope", value: {} });
    assert.deepEqual(out, { issues: ["bad-kind"], kind: "unknown", ok: false, value: null });
    assert.deepEqual(Object.keys(out), topErrKeys);
  });
  it("missing kind returns bad-kind", () => {
    const out = runFeature({ value: { initialized: false, usingCrazyGames: false } });
    assert.deepEqual(out.issues, ["bad-kind"]);
    assert.equal(out.kind, "unknown");
  });
  it("non-object payload returns bad-payload", () => {
    assert.deepEqual(runFeature(null).issues, ["bad-payload"]);
    assert.deepEqual(runFeature("x").issues, ["bad-payload"]);
    assert.deepEqual(runFeature([]).issues, ["bad-payload"]);
    assert.equal(runFeature(null).kind, "unknown");
  });
  it("single bad-value shape", () => {
    const out = runFeature({ kind: "check-platform-init", value: { initialized: false } });
    assert.deepEqual(out, { issues: ["bad-value"], kind: "check-platform-init", ok: false, value: null });
    const out2 = runFeature({ kind: "check-platform-init", value: null });
    assert.deepEqual(out2.issues, ["bad-value"]);
  });
  it("batch bad-requests shape", () => {
    const out = runFeature({ kind: "check-platform-init-batch", value: { requests: "no" } });
    assert.deepEqual(out.issues, ["bad-requests"]);
    assert.equal(out.kind, "check-platform-init-batch");
    const out2 = runFeature({ kind: "check-platform-init-batch", value: {} });
    assert.deepEqual(out2.issues, ["bad-requests"]);
  });
});

describe("purity ordering preservation", () => {
  it("preserves input and deterministic", () => {
    const payload = { kind: "check-platform-init", value: { initialized: true, usingCrazyGames: false } };
    const before = JSON.stringify(payload);
    const a = runFeature(payload);
    const b = runFeature(JSON.parse(before));
    assert.deepEqual(a, b);
    assert.equal(JSON.stringify(payload), before);
    assert.deepEqual(Object.keys(a), topOkKeys);
    assert.deepEqual(Object.keys(a.value), singleKeys);
  });
});
