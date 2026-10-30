import { test } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_init_dependency_guard.mjs";

test("gameplayStart requires init", () => {
  const out = runFeature({ kind: "check-init-dependency", value: { method: "gameplayStart" } });
  assert.equal(out.ok, true);
  assert.equal(out.kind, "check-init-dependency");
  assert.equal(out.value.valid, true);
  assert.equal(out.value.requiresInit, true);
  assert.equal(out.value.localOnly, false);
  assert.deepEqual(out.value.issues, []);
  assert.equal(out.value.method, "gameplayStart");
  assert.deepEqual(Object.keys(out.value), ["issues", "localOnly", "method", "requiresInit", "valid"]);
  assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
});

test("getSettings is local only", () => {
  const out = runFeature({ kind: "check-init-dependency", value: { method: "getSettings" } });
  assert.equal(out.ok, true);
  assert.equal(out.value.valid, true);
  assert.equal(out.value.requiresInit, false);
  assert.equal(out.value.localOnly, true);
  assert.deepEqual(out.value.issues, []);
  assert.deepEqual(Object.keys(out.value), ["issues", "localOnly", "method", "requiresInit", "valid"]);
});

test("unknown method returns valid false", () => {
  const out = runFeature({ kind: "check-init-dependency", value: { method: "unknown" } });
  assert.equal(out.ok, true);
  assert.equal(out.kind, "check-init-dependency");
  assert.equal(out.value.valid, false);
  assert.equal(out.value.requiresInit, null);
  assert.equal(out.value.localOnly, null);
  assert.deepEqual(out.value.issues, ["bad-method"]);
  assert.equal(out.value.method, "unknown");
  assert.deepEqual(Object.keys(out.value), ["issues", "localOnly", "method", "requiresInit", "valid"]);
});

test("batch preserves order with ordered keys", () => {
  const input = { kind: "check-init-dependency-batch", value: { requests: [{ method: "gameplayStart" }, { method: "getSettings" }, { method: "unknown" }] } };
  const before = JSON.stringify(input);
  const out = runFeature(input);
  assert.equal(out.ok, true);
  assert.equal(out.kind, "check-init-dependency-batch");
  assert.equal(out.value.results.length, 3);
  assert.equal(out.value.results[0].method, "gameplayStart");
  assert.equal(out.value.results[1].method, "getSettings");
  assert.equal(out.value.results[2].method, "unknown");
  assert.equal(out.value.results[0].valid, true);
  assert.equal(out.value.results[0].requiresInit, true);
  assert.equal(out.value.results[1].localOnly, true);
  assert.equal(out.value.results[2].valid, false);
  assert.deepEqual(out.value.results[2].issues, ["bad-method"]);
  for (const r of out.value.results) {
    assert.deepEqual(Object.keys(r), ["issues", "localOnly", "method", "requiresInit", "valid"]);
  }
  assert.equal(JSON.stringify(input), before);
});

test("unknown kind returns bad-kind", () => {
  const input = { kind: "nope", value: {} };
  const before = JSON.stringify(input);
  const out = runFeature(input);
  assert.equal(out.ok, false);
  assert.equal(out.kind, "unknown");
  assert.equal(out.value, null);
  assert.deepEqual(out.issues, ["bad-kind"]);
  assert.deepEqual(Object.keys(out), ["issues", "kind", "ok", "value"]);
  assert.equal(JSON.stringify(input), before);
});
