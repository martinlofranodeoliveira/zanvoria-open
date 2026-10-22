import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_preview_port_guard.mjs";

describe("wildbound preview port guard", () => {
  it("default port 8080 yields allowed default-port", () => {
    const out = runFeature({ kind: "check-preview-port", value: { port: 8080 } });
    assert.deepEqual(out, {
      kind: "check-preview-port",
      ok: true,
      value: { allowed: true, effective: 8080, issues: [], port: 8080, reason: "default-port", valid: true }
    });
    assert.deepEqual(Object.keys(out.value), ["allowed", "effective", "issues", "port", "reason", "valid"]);
  });
  it("ephemeral port 0 yields ephemeral-port", () => {
    const out = runFeature({ kind: "check-preview-port", value: { port: 0 } });
    assert.deepEqual(out, {
      kind: "check-preview-port",
      ok: true,
      value: { allowed: true, effective: 0, issues: [], port: 0, reason: "ephemeral-port", valid: true }
    });
  });
  it("custom port 3000 yields custom-port", () => {
    const out = runFeature({ kind: "check-preview-port", value: { port: 3000 } });
    assert.equal(out.ok, true);
    assert.equal(out.value.allowed, true);
    assert.equal(out.value.effective, 3000);
    assert.equal(out.value.reason, "custom-port");
    assert.equal(out.value.valid, true);
    assert.deepEqual(out.value.issues, []);
  });
  it("out of range 70000 yields invalid-port with valid true", () => {
    const out = runFeature({ kind: "check-preview-port", value: { port: 70000 } });
    assert.deepEqual(out, {
      kind: "check-preview-port",
      ok: true,
      value: { allowed: false, effective: null, issues: [], port: 70000, reason: "invalid-port", valid: true }
    });
  });
  it("negative port yields invalid-port", () => {
    const out = runFeature({ kind: "check-preview-port", value: { port: -1 } });
    assert.equal(out.value.valid, true);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.reason, "invalid-port");
    assert.equal(out.value.effective, null);
  });
  it("malformed object port yields bad-port with null echo", () => {
    const out = runFeature({ kind: "check-preview-port", value: { port: { x: 1 } } });
    assert.deepEqual(out, {
      kind: "check-preview-port",
      ok: true,
      value: { allowed: false, effective: null, issues: ["bad-port"], port: null, reason: null, valid: false }
    });
  });
  it("malformed string port yields bad-port with null echo", () => {
    const out = runFeature({ kind: "check-preview-port", value: { port: "8080" } });
    assert.equal(out.value.valid, false);
    assert.equal(out.value.port, null);
    assert.deepEqual(out.value.issues, ["bad-port"]);
    assert.equal(out.value.allowed, false);
  });
  it("non-integer safe number echoes numeric with bad-port", () => {
    const out = runFeature({ kind: "check-preview-port", value: { port: 1.5 } });
    assert.equal(out.value.valid, false);
    assert.equal(out.value.port, 1.5);
    assert.deepEqual(out.value.issues, ["bad-port"]);
  });
  it("batch evaluates independently in order", () => {
    const out = runFeature({
      kind: "check-preview-port-batch",
      value: { requests: [{ port: 8080 }, { port: 0 }, { port: 70000 }] }
    });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-preview-port-batch");
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].reason, "default-port");
    assert.equal(out.value.results[1].reason, "ephemeral-port");
    assert.equal(out.value.results[2].reason, "invalid-port");
    assert.equal(out.value.results[2].valid, true);
  });
  it("batch empty succeeds", () => {
    const out = runFeature({ kind: "check-preview-port-batch", value: { requests: [] } });
    assert.deepEqual(out, { kind: "check-preview-port-batch", ok: true, value: { results: [] } });
  });
  it("batch with malformed port stays ordered and independent", () => {
    const out = runFeature({
      kind: "check-preview-port-batch",
      value: { requests: [{ port: 3000 }, { port: "x" }] }
    });
    assert.equal(out.ok, true);
    assert.equal(out.value.results[0].valid, true);
    assert.equal(out.value.results[0].reason, "custom-port");
    assert.equal(out.value.results[1].valid, false);
    assert.deepEqual(out.value.results[1].issues, ["bad-port"]);
  });
  it("batch too long returns bad-requests", () => {
    const requests = [];
    for (let i = 0; i < 17; i++) {
      requests.push({ port: 8080 });
    }
    const out = runFeature({ kind: "check-preview-port-batch", value: { requests } });
    assert.equal(out.ok, false);
    assert.deepEqual(out.issues, ["bad-requests"]);
    assert.equal(out.value, null);
  });
  it("bad-kind for unknown kind", () => {
    const out = runFeature({ kind: "nope", value: {} });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.deepEqual(out.issues, ["bad-kind"]);
  });
  it("bad-payload for non-object", () => {
    const out = runFeature(null);
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.deepEqual(out.issues, ["bad-payload"]);
  });
  it("bad-value for single with extra key", () => {
    const out = runFeature({ kind: "check-preview-port", value: { port: 8080, extra: 1 } });
    assert.equal(out.ok, false);
    assert.deepEqual(out.issues, ["bad-value"]);
    assert.equal(out.kind, "check-preview-port");
  });
  it("bad-requests for batch with bad element shape", () => {
    const out = runFeature({ kind: "check-preview-port-batch", value: { requests: [{ nope: 1 }] } });
    assert.equal(out.ok, false);
    assert.deepEqual(out.issues, ["bad-requests"]);
  });
  it("preserves input and is deterministic", () => {
    const input = { kind: "check-preview-port", value: { port: 8080 } };
    const snapshot = JSON.parse(JSON.stringify(input));
    const a = runFeature(input);
    const b = runFeature({ kind: "check-preview-port", value: { port: 8080 } });
    assert.deepEqual(input, snapshot);
    assert.deepEqual(a, b);
    assert.deepEqual(Object.keys(a), ["kind", "ok", "value"]);
  });
});
