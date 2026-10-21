import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_node_engine_guard.mjs";

describe("wildbound node engine guard", () => {
  it("major 22 is supported", () => {
    const out = runFeature({ kind: "check-node-engine", value: { major: 22 } });
    assert.deepStrictEqual(out, { kind: "check-node-engine", ok: true, value: { issues: [], major: 22, reason: null, supported: true, valid: true } });
    assert.deepStrictEqual(Object.keys(out.value), ["issues", "major", "reason", "supported", "valid"]);
    assert.deepStrictEqual(Object.keys(out), ["kind", "ok", "value"]);
  });
  it("major 16 is too old", () => {
    const out = runFeature({ kind: "check-node-engine", value: { major: 16 } });
    assert.deepStrictEqual(out, { kind: "check-node-engine", ok: true, value: { issues: [], major: 16, reason: "engine-too-old", supported: false, valid: true } });
  });
  it("string major is bad-major", () => {
    const out = runFeature({ kind: "check-node-engine", value: { major: "22" } });
    assert.deepStrictEqual(out, { kind: "check-node-engine", ok: true, value: { issues: ["bad-major"], major: null, reason: null, supported: false, valid: false } });
  });
  it("batch preserves order and orders keys", () => {
    const input = { kind: "check-node-engine-batch", value: { requests: [{ major: 22 }, { major: 16 }] } };
    const snapshot = JSON.parse(JSON.stringify(input));
    const out = runFeature(input);
    assert.strictEqual(out.ok, true);
    assert.strictEqual(out.kind, "check-node-engine-batch");
    assert.strictEqual(out.value.results.length, 2);
    assert.deepStrictEqual(Object.keys(out), ["kind", "ok", "value"]);
    assert.deepStrictEqual(Object.keys(out.value), ["results"]);
    for (const r of out.value.results) {
      assert.deepStrictEqual(Object.keys(r), ["issues", "major", "reason", "supported", "valid"]);
    }
    assert.strictEqual(out.value.results[0].major, 22);
    assert.strictEqual(out.value.results[0].supported, true);
    assert.strictEqual(out.value.results[0].reason, null);
    assert.strictEqual(out.value.results[1].major, 16);
    assert.strictEqual(out.value.results[1].supported, false);
    assert.strictEqual(out.value.results[1].reason, "engine-too-old");
    assert.deepStrictEqual(input, snapshot);
  });
  it("unknown kind returns bad-kind", () => {
    const out = runFeature({ kind: "nope", value: {} });
    assert.deepStrictEqual(out, { issues: ["bad-kind"], kind: "unknown", ok: false, value: null });
    assert.deepStrictEqual(Object.keys(out), ["issues", "kind", "ok", "value"]);
  });
  it("malformed batch value returns bad-value or bad-requests", () => {
    const a = runFeature({ kind: "check-node-engine-batch", value: { oops: [] } });
    assert.strictEqual(a.ok, false);
    assert.strictEqual(a.kind, "check-node-engine-batch");
    assert.strictEqual(a.value, null);
    assert.deepStrictEqual(a.issues, ["bad-value"]);
    const b = runFeature({ kind: "check-node-engine-batch", value: { requests: "no" } });
    assert.strictEqual(b.ok, false);
    assert.strictEqual(b.value, null);
    assert.ok(b.issues[0] === "bad-value" || b.issues[0] === "bad-requests");
    const c = runFeature({ kind: "check-node-engine-batch", value: { requests: [{ nope: 1 }] } });
    assert.strictEqual(c.ok, false);
    assert.ok(c.issues[0] === "bad-value" || c.issues[0] === "bad-requests");
  });
  it("non-object payload returns bad-payload", () => {
    const out = runFeature(null);
    assert.deepStrictEqual(out, { issues: ["bad-payload"], kind: "unknown", ok: false, value: null });
  });
  it("float major is bad-major but preserves numeric echo", () => {
    const out = runFeature({ kind: "check-node-engine", value: { major: 22.5 } });
    assert.strictEqual(out.ok, true);
    assert.strictEqual(out.value.valid, false);
    assert.deepStrictEqual(out.value.issues, ["bad-major"]);
    assert.strictEqual(out.value.major, 22.5);
    assert.strictEqual(out.value.supported, false);
  });
  it("batch with mixed valid and bad-major evaluates independently", () => {
    const out = runFeature({ kind: "check-node-engine-batch", value: { requests: [{ major: 22 }, { major: "22" }] } });
    assert.strictEqual(out.ok, true);
    assert.strictEqual(out.value.results.length, 2);
    assert.strictEqual(out.value.results[0].valid, true);
    assert.strictEqual(out.value.results[1].valid, false);
    assert.deepStrictEqual(out.value.results[1].issues, ["bad-major"]);
    assert.strictEqual(out.value.results[1].major, null);
  });
  it("is deterministic and preserves input", () => {
    const input = { kind: "check-node-engine", value: { major: 22 } };
    const before = JSON.stringify(input);
    const a = runFeature(input);
    const b = runFeature(JSON.parse(before));
    assert.deepStrictEqual(a, b);
    assert.strictEqual(JSON.stringify(input), before);
  });
});
