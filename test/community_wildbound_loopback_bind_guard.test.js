import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature, checkLoopbackBind, checkLoopbackBindBatch } from "../js/community/wildbound_loopback_bind_guard.mjs";

function keysOf(v) {
  return Object.keys(v);
}

describe("wildbound loopback bind guard - single valid", () => {
  it("accepts 127.0.0.1:8080 as valid allowed", () => {
    const out = runFeature({ kind: "check-loopback-bind", value: { host: "127.0.0.1", port: 8080 } });
    assert.deepEqual(out, { kind: "check-loopback-bind", ok: true, value: { allowed: true, host: "127.0.0.1", issues: [], port: 8080, reason: null, valid: true } });
  });
  it("accepts 127.0.0.1:0 ephemeral", () => {
    const out = runFeature({ kind: "check-loopback-bind", value: { host: "127.0.0.1", port: 0 } });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.allowed, true);
    assert.equal(out.value.reason, null);
    assert.equal(out.value.port, 0);
    assert.deepEqual(out.value.issues, []);
  });
  it("rejects non-loopback as valid not allowed", () => {
    const out = runFeature({ kind: "check-loopback-bind", value: { host: "0.0.0.0", port: 8080 } });
    assert.deepEqual(out, { kind: "check-loopback-bind", ok: true, value: { allowed: false, host: "0.0.0.0", issues: [], port: 8080, reason: "non-loopback-host", valid: true } });
  });
});

describe("wildbound loopback bind guard - malformed fields", () => {
  it("flags object host as bad-host", () => {
    const out = runFeature({ kind: "check-loopback-bind", value: { host: { x: 1 }, port: 8080 } });
    assert.deepEqual(out, { kind: "check-loopback-bind", ok: true, value: { allowed: false, host: null, issues: ["bad-host"], port: 8080, reason: null, valid: false } });
  });
  it("flags letters in host as bad-host", () => {
    const out = runFeature({ kind: "check-loopback-bind", value: { host: "localhost", port: 8080 } });
    assert.equal(out.value.valid, false);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.reason, null);
    assert.deepEqual(out.value.issues, ["bad-host"]);
    assert.equal(out.value.host, "localhost");
  });
  it("flags bad port shapes", () => {
    const badPorts = ["8080", 1.5, -1, 70000, NaN, Infinity];
    for (const p of badPorts) {
      const out = runFeature({ kind: "check-loopback-bind", value: { host: "127.0.0.1", port: p } });
      assert.equal(out.value.valid, false);
      assert.equal(out.value.allowed, false);
      assert.ok(out.value.issues.includes("bad-port"));
    }
  });
  it("flags both bad-host and bad-port in order", () => {
    const out = runFeature({ kind: "check-loopback-bind", value: { host: 123, port: "x" } });
    assert.deepEqual(out.value.issues, ["bad-host", "bad-port"]);
    assert.equal(out.value.host, null);
    assert.equal(out.value.port, null);
    assert.equal(out.value.valid, false);
  });
});

describe("wildbound loopback bind guard - batch", () => {
  it("handles batch in order", () => {
    const out = runFeature({ kind: "check-loopback-bind-batch", value: { requests: [{ host: "127.0.0.1", port: 80 }, { host: "0.0.0.0", port: 80 }, { host: "nope", port: 80 }] } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-loopback-bind-batch");
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].allowed, true);
    assert.equal(out.value.results[1].reason, "non-loopback-host");
    assert.equal(out.value.results[2].valid, false);
    assert.deepEqual(out.value.results[2].issues, ["bad-host"]);
  });
  it("handles empty batch", () => {
    const out = runFeature({ kind: "check-loopback-bind-batch", value: { requests: [] } });
    assert.deepEqual(out, { kind: "check-loopback-bind-batch", ok: true, value: { results: [] } });
  });
  it("rejects oversized batch with bad-requests", () => {
    const reqs = [];
    for (let i = 0; i < 17; i++) reqs.push({ host: "127.0.0.1", port: 80 });
    const out = runFeature({ kind: "check-loopback-bind-batch", value: { requests: reqs } });
    assert.equal(out.ok, false);
    assert.deepEqual(out.issues, ["bad-requests"]);
    assert.equal(out.value, null);
  });
  it("rejects structural element with bad-requests", () => {
    const out = runFeature({ kind: "check-loopback-bind-batch", value: { requests: [{ host: "127.0.0.1" }] } });
    assert.equal(out.ok, false);
    assert.deepEqual(out.issues, ["bad-requests"]);
  });
});

describe("wildbound loopback bind guard - errors", () => {
  it("rejects unknown kind with bad-kind", () => {
    const out = runFeature({ kind: "nope", value: {} });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.deepEqual(out.issues, ["bad-kind"]);
    assert.equal(out.value, null);
  });
  it("rejects non-object payload with bad-payload", () => {
    for (const p of [null, 42, "x", []]) {
      const out = runFeature(p);
      assert.equal(out.ok, false);
      assert.deepEqual(out.issues, ["bad-payload"]);
    }
  });
  it("rejects malformed single value with bad-value", () => {
    const out = runFeature({ kind: "check-loopback-bind", value: { host: "127.0.0.1" } });
    assert.equal(out.ok, false);
    assert.deepEqual(out.issues, ["bad-value"]);
  });
  it("rejects malformed batch value with bad-value or bad-requests", () => {
    const a = runFeature({ kind: "check-loopback-bind-batch", value: {} });
    assert.equal(a.ok, false);
    const b = runFeature({ kind: "check-loopback-bind-batch", value: { requests: "x" } });
    assert.equal(b.ok, false);
    assert.deepEqual(b.issues, ["bad-requests"]);
  });
});

describe("wildbound loopback bind guard - purity and ordering", () => {
  it("preserves input", () => {
    const input = { kind: "check-loopback-bind", value: { host: "127.0.0.1", port: 8080 } };
    const before = JSON.stringify(input);
    runFeature(input);
    runFeature({ kind: "check-loopback-bind-batch", value: { requests: [{ host: "127.0.0.1", port: 1 }] } });
    assert.equal(JSON.stringify(input), before);
  });
  it("orders keys alphabetically", () => {
    const single = runFeature({ kind: "check-loopback-bind", value: { host: "127.0.0.1", port: 8080 } });
    assert.deepEqual(keysOf(single), ["kind", "ok", "value"]);
    assert.deepEqual(keysOf(single.value), ["allowed", "host", "issues", "port", "reason", "valid"]);
    const err = runFeature({ kind: "bad", value: null });
    assert.deepEqual(keysOf(err), ["issues", "kind", "ok", "value"]);
    const batch = runFeature({ kind: "check-loopback-bind-batch", value: { requests: [{ host: "127.0.0.1", port: 1 }] } });
    assert.deepEqual(keysOf(batch.value.results[0]), ["allowed", "host", "issues", "port", "reason", "valid"]);
  });
  it("is deterministic", () => {
    const p = { kind: "check-loopback-bind", value: { host: "0.0.0.0", port: 1234 } };
    assert.deepEqual(runFeature(p), runFeature(JSON.parse(JSON.stringify(p))));
  });
  it("exposes pure helpers", () => {
    assert.equal(typeof checkLoopbackBind, "function");
    assert.equal(typeof checkLoopbackBindBatch, "function");
    const r = checkLoopbackBind({ host: "127.0.0.1", port: 8080 });
    assert.equal(r.valid, true);
    assert.equal(r.allowed, true);
  });
});
