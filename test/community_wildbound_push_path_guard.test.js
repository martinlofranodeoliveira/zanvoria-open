import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as guard from "../js/community/wildbound_push_path_guard.mjs";

function assertOrdered(obj) {
  const keys = Object.keys(obj);
  const sorted = keys.slice().sort();
  assert.deepEqual(keys, sorted);
}

describe("wildbound push path guard", () => {
  it("exposes runFeature as function", () => {
    assert.equal(typeof guard.runFeature, "function");
  });
  it("allowed contribution path js/game.js", () => {
    const out = guard.runFeature({ kind: "check-push-path", value: { path: "js/game.js" } });
    assert.deepEqual(out, {
      kind: "check-push-path",
      ok: true,
      value: { allowed: true, blockedReason: null, issues: [], path: "js/game.js", valid: true }
    });
    assertOrdered(out);
    assertOrdered(out.value);
  });
  it("dotfile segment .env is denied", () => {
    const out = guard.runFeature({ kind: "check-push-path", value: { path: ".env" } });
    assert.deepEqual(out, {
      kind: "check-push-path",
      ok: true,
      value: { allowed: false, blockedReason: "dotfile-denied", issues: [], path: ".env", valid: true }
    });
    assertOrdered(out.value);
  });
  it("denies nested dotfile segments", () => {
    const out = guard.runFeature({ kind: "check-push-path", value: { path: ".git/config" } });
    assert.equal(out.ok, true);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.blockedReason, "dotfile-denied");
    assert.equal(out.value.valid, true);
    assert.deepEqual(out.value.issues, []);
    const out2 = guard.runFeature({ kind: "check-push-path", value: { path: "a/.hidden/b.txt" } });
    assert.equal(out2.value.allowed, false);
    assert.equal(out2.value.blockedReason, "dotfile-denied");
  });
  it("sensitive push uploads/demo-save.json is denied", () => {
    const out = guard.runFeature({ kind: "check-push-path", value: { path: "uploads/demo-save.json" } });
    assert.deepEqual(out, {
      kind: "check-push-path",
      ok: true,
      value: { allowed: false, blockedReason: "sensitive-push-denied", issues: [], path: "uploads/demo-save.json", valid: true }
    });
  });
  it("denies sensitive markers case-insensitively", () => {
    const cases = ["CHAVES/id.txt", "Banco/data.json", "UPLOAD/a.txt", "dados-PESSOAL.txt"];
    for (const p of cases) {
      const out = guard.runFeature({ kind: "check-push-path", value: { path: p } });
      assert.equal(out.value.allowed, false);
      assert.equal(out.value.blockedReason, "sensitive-push-denied");
      assert.equal(out.value.valid, true);
    }
  });
  it("dotfile takes precedence over sensitive", () => {
    const out = guard.runFeature({ kind: "check-push-path", value: { path: ".uploads" } });
    assert.equal(out.value.blockedReason, "dotfile-denied");
  });
  it("malformed path value returns bad-path", () => {
    const out = guard.runFeature({ kind: "check-push-path", value: { path: "bad path!" } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-push-path");
    assert.equal(out.value.valid, false);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.blockedReason, null);
    assert.deepEqual(out.value.issues, ["bad-path"]);
    assertOrdered(out.value);
  });
  it("malformed non-string and empty paths", () => {
    const a = guard.runFeature({ kind: "check-push-path", value: { path: "" } });
    assert.equal(a.value.valid, false);
    assert.deepEqual(a.value.issues, ["bad-path"]);
    const b = guard.runFeature({ kind: "check-push-path", value: { path: 123 } });
    assert.equal(b.value.valid, false);
    assert.equal(b.value.path, null);
    assert.deepEqual(b.value.issues, ["bad-path"]);
    const c = guard.runFeature({ kind: "check-push-path", value: { path: null } });
    assert.equal(c.value.path, null);
    assert.deepEqual(c.value.issues, ["bad-path"]);
  });
  it("batch evaluates in order with push", () => {
    const out = guard.runFeature({
      kind: "check-push-path-batch",
      value: { requests: [{ path: "js/game.js" }, { path: ".env" }, { path: "uploads/demo-save.json" }] }
    });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-push-path-batch");
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].allowed, true);
    assert.equal(out.value.results[1].blockedReason, "dotfile-denied");
    assert.equal(out.value.results[2].blockedReason, "sensitive-push-denied");
    assertOrdered(out);
    for (const r of out.value.results) {
      assertOrdered(r);
    }
  });
  it("batch supports 0 requests", () => {
    const out = guard.runFeature({ kind: "check-push-path-batch", value: { requests: [] } });
    assert.deepEqual(out, { kind: "check-push-path-batch", ok: true, value: { results: [] } });
  });
  it("batch rejects too many requests", () => {
    const requests = [];
    for (let i = 0; i < 17; i += 1) {
      requests.push({ path: "a.txt" });
    }
    const out = guard.runFeature({ kind: "check-push-path-batch", value: { requests } });
    assert.equal(out.ok, false);
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-requests"]);
    assertOrdered(out);
  });
  it("unknown kind returns bad-kind", () => {
    const out = guard.runFeature({ kind: "nope", value: {} });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-kind"]);
    assertOrdered(out);
  });
  it("non-object payload returns bad-payload", () => {
    for (const p of [null, [], "x", 5]) {
      const out = guard.runFeature(p);
      assert.equal(out.ok, false);
      assert.equal(out.kind, "unknown");
      assert.equal(out.value, null);
      assert.deepEqual(out.issues, ["bad-payload"]);
    }
  });
  it("malformed value returns bad-value", () => {
    const out = guard.runFeature({ kind: "check-push-path", value: {} });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "check-push-path");
    assert.deepEqual(out.issues, ["bad-value"]);
    const out2 = guard.runFeature({ kind: "check-push-path-batch", value: {} });
    assert.deepEqual(out2.issues, ["bad-value"]);
  });
  it("malformed requests returns bad-requests", () => {
    const out = guard.runFeature({ kind: "check-push-path-batch", value: { requests: "no" } });
    assert.deepEqual(out.issues, ["bad-requests"]);
    const out2 = guard.runFeature({ kind: "check-push-path-batch", value: { requests: [{ path: "a.txt" }, { bad: 1 }] } });
    assert.deepEqual(out2.issues, ["bad-requests"]);
  });
  it("remains pure deterministic without mutating input", () => {
    const input = { kind: "check-push-path", value: { path: "js/game.js" } };
    const snap = JSON.stringify(input);
    const a = guard.runFeature(input);
    const b = guard.runFeature(JSON.parse(snap));
    assert.deepEqual(a, b);
    assert.equal(JSON.stringify(input), snap);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
  });
});
