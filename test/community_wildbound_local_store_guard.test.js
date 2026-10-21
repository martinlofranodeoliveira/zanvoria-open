import { test } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_local_store_guard.mjs";

test("check-store-key save is allowed", () => {
  const input = {kind: "check-store-key", value: {storeKey: "aether-rift:wildbound:save"}};
  const before = JSON.stringify(input);
  const out = runFeature(input);
  assert.equal(out.ok, true);
  assert.equal(out.kind, "check-store-key");
  assert.equal(out.value.valid, true);
  assert.equal(out.value.allowed, true);
  assert.equal(out.value.reason, null);
  assert.deepEqual(out.value.issues, []);
  assert.equal(out.value.storeKey, "aether-rift:wildbound:save");
  assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
  assert.deepEqual(Object.keys(out.value), ["allowed", "issues", "reason", "storeKey", "valid"]);
  assert.equal(JSON.stringify(input), before);
});

test("check-store-key settings and last-score are allowed", () => {
  const a = runFeature({kind: "check-store-key", value: {storeKey: "aether-rift:wildbound:settings"}});
  assert.equal(a.value.allowed, true);
  assert.equal(a.value.reason, null);
  assert.equal(a.value.valid, true);
  const b = runFeature({kind: "check-store-key", value: {storeKey: "aether-rift:wildbound:last-score"}});
  assert.equal(b.value.allowed, true);
  assert.equal(b.value.reason, null);
  assert.equal(b.value.valid, true);
});

test("check-store-key unlisted returns unlisted-key", () => {
  const out = runFeature({kind: "check-store-key", value: {storeKey: "aether-rift:wildbound:other"}});
  assert.equal(out.ok, true);
  assert.equal(out.kind, "check-store-key");
  assert.equal(out.value.valid, true);
  assert.equal(out.value.allowed, false);
  assert.equal(out.value.reason, "unlisted-key");
  assert.deepEqual(out.value.issues, []);
  assert.deepEqual(Object.keys(out.value), ["allowed", "issues", "reason", "storeKey", "valid"]);
});

test("check-store-key non-string storeKey returns bad-store-key", () => {
  const out = runFeature({kind: "check-store-key", value: {storeKey: {x: 1}}});
  assert.equal(out.ok, true);
  assert.equal(out.value.valid, false);
  assert.equal(out.value.allowed, false);
  assert.equal(out.value.reason, null);
  assert.equal(out.value.storeKey, null);
  assert.deepEqual(out.value.issues, ["bad-store-key"]);
});

test("check-store-key malformed charset is invalid", () => {
  const out = runFeature({kind: "check-store-key", value: {storeKey: "aether rift"}});
  assert.equal(out.ok, true);
  assert.equal(out.value.valid, false);
  assert.deepEqual(out.value.issues, ["bad-store-key"]);
  assert.equal(out.value.storeKey, "aether rift");
});

test("check-store-key-batch evaluates independently in order", () => {
  const input = {
    kind: "check-store-key-batch",
    value: {
      requests: [
        {storeKey: "aether-rift:wildbound:save"},
        {storeKey: "aether-rift:wildbound:other"},
        {storeKey: 7}
      ]
    }
  };
  const before = JSON.stringify(input);
  const out = runFeature(input);
  assert.equal(out.ok, true);
  assert.equal(out.kind, "check-store-key-batch");
  assert.equal(Array.isArray(out.value.results), true);
  assert.equal(out.value.results.length, 3);
  assert.equal(out.value.results[0].allowed, true);
  assert.equal(out.value.results[0].valid, true);
  assert.equal(out.value.results[1].allowed, false);
  assert.equal(out.value.results[1].reason, "unlisted-key");
  assert.equal(out.value.results[2].valid, false);
  assert.deepEqual(out.value.results[2].issues, ["bad-store-key"]);
  for (const r of out.value.results) {
    assert.deepEqual(Object.keys(r), ["allowed", "issues", "reason", "storeKey", "valid"]);
  }
  assert.equal(JSON.stringify(input), before);
});

test("unknown kind returns bad-kind with no mutation", () => {
  const input = {kind: "unknown", value: {storeKey: "aether-rift:wildbound:save"}};
  const before = JSON.stringify(input);
  const out = runFeature(input);
  assert.equal(out.ok, false);
  assert.equal(out.kind, "unknown");
  assert.equal(out.value, null);
  assert.deepEqual(out.issues, ["bad-kind"]);
  assert.deepEqual(Object.keys(out), ["issues", "kind", "ok", "value"]);
  assert.equal(JSON.stringify(input), before);
});

test("bad value shape returns bad-value", () => {
  const out = runFeature({kind: "check-store-key", value: {nope: 1}});
  assert.equal(out.ok, false);
  assert.equal(out.kind, "check-store-key");
  assert.deepEqual(out.issues, ["bad-value"]);
  assert.equal(out.value, null);
});

test("bad requests shape returns bad-requests", () => {
  const out = runFeature({kind: "check-store-key-batch", value: {requests: [{bad: 1}]}});
  assert.equal(out.ok, false);
  assert.equal(out.kind, "check-store-key-batch");
  assert.deepEqual(out.issues, ["bad-requests"]);
});
