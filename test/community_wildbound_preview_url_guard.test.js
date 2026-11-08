import { test } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_preview_url_guard.mjs";

test("well-formed allowed http 127.0.0.1 8080", () => {
  const out = runFeature({ kind: "check-preview-url", value: { host: "127.0.0.1", port: 8080, protocol: "http" } });
  assert.deepEqual(out, { kind: "check-preview-url", ok: true, value: { allowed: true, blockedReason: null, host: "127.0.0.1", issues: [], port: 8080, protocol: "http", url: "http://127.0.0.1:8080", valid: true } });
  assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
  assert.deepEqual(Object.keys(out.value), ["allowed", "blockedReason", "host", "issues", "port", "protocol", "url", "valid"]);
});

test("well-formed allowed ephemeral 0 and max 65535", () => {
  const zero = runFeature({ kind: "check-preview-url", value: { host: "127.0.0.1", port: 0, protocol: "http" } });
  assert.equal(zero.ok, true);
  assert.equal(zero.value.valid, true);
  assert.equal(zero.value.allowed, true);
  assert.equal(zero.value.blockedReason, null);
  assert.equal(zero.value.url, "http://127.0.0.1:0");
  const max = runFeature({ kind: "check-preview-url", value: { host: "127.0.0.1", port: 65535, protocol: "http" } });
  assert.equal(max.value.allowed, true);
  assert.equal(max.value.url, "http://127.0.0.1:65535");
});

test("well-formed denied with priority blockedReason", () => {
  const https = runFeature({ kind: "check-preview-url", value: { host: "127.0.0.1", port: 8080, protocol: "https" } });
  assert.equal(https.value.valid, true);
  assert.equal(https.value.allowed, false);
  assert.equal(https.value.blockedReason, "non-http-protocol");
  assert.equal(https.value.url, "https://127.0.0.1:8080");
  const host = runFeature({ kind: "check-preview-url", value: { host: "192.168.1.10", port: 8080, protocol: "http" } });
  assert.equal(host.value.allowed, false);
  assert.equal(host.value.blockedReason, "non-loopback-host");
  assert.equal(host.value.url, "http://192.168.1.10:8080");
  const port = runFeature({ kind: "check-preview-url", value: { host: "127.0.0.1", port: 70000, protocol: "http" } });
  assert.equal(port.value.allowed, false);
  assert.equal(port.value.blockedReason, "port-out-of-range");
  const both = runFeature({ kind: "check-preview-url", value: { host: "10.0.0.1", port: 1, protocol: "ftp" } });
  assert.equal(both.value.blockedReason, "non-http-protocol");
});

test("malformed fields return valid false with ordered issues", () => {
  const badPort = runFeature({ kind: "check-preview-url", value: { host: "127.0.0.1", port: { x: 1 }, protocol: "http" } });
  assert.deepEqual(badPort, { kind: "check-preview-url", ok: true, value: { allowed: false, blockedReason: null, host: "127.0.0.1", issues: ["bad-port"], port: null, protocol: "http", url: null, valid: false } });
  const allBad = runFeature({ kind: "check-preview-url", value: { host: "ABC", port: "x", protocol: "HTTP" } });
  assert.deepEqual(allBad.value.issues, ["bad-host", "bad-port", "bad-protocol"]);
  assert.equal(allBad.value.valid, false);
  assert.equal(allBad.value.url, null);
  assert.equal(allBad.value.host, "ABC");
  assert.equal(allBad.value.port, null);
  assert.equal(allBad.value.protocol, "HTTP");
});

test("batch evaluates independently and preserves order", () => {
  const out = runFeature({ kind: "check-preview-url-batch", value: { requests: [{ host: "127.0.0.1", port: 8080, protocol: "http" }, { host: "192.168.1.10", port: 8080, protocol: "http" }, { host: "127.0.0.1", port: "bad", protocol: "http" }] } });
  assert.equal(out.ok, true);
  assert.equal(out.kind, "check-preview-url-batch");
  assert.equal(out.value.results.length, 3);
  assert.equal(out.value.results[0].allowed, true);
  assert.equal(out.value.results[1].blockedReason, "non-loopback-host");
  assert.deepEqual(out.value.results[2].issues, ["bad-port"]);
  for (const item of out.value.results) {
    assert.deepEqual(Object.keys(item), ["allowed", "blockedReason", "host", "issues", "port", "protocol", "url", "valid"]);
  }
  const empty = runFeature({ kind: "check-preview-url-batch", value: { requests: [] } });
  assert.deepEqual(empty.value.results, []);
});

test("invalid kind payload and malformed values", () => {
  assert.deepEqual(runFeature({ kind: "nope", value: {} }), { issues: ["bad-kind"], kind: "unknown", ok: false, value: null });
  assert.deepEqual(runFeature(null), { issues: ["bad-payload"], kind: "unknown", ok: false, value: null });
  assert.deepEqual(runFeature("x"), { issues: ["bad-payload"], kind: "unknown", ok: false, value: null });
  assert.deepEqual(runFeature({ kind: "check-preview-url", value: { host: "127.0.0.1", port: 8080 } }), { issues: ["bad-value"], kind: "check-preview-url", ok: false, value: null });
  assert.deepEqual(runFeature({ kind: "check-preview-url-batch", value: { requests: "no" } }), { issues: ["bad-requests"], kind: "check-preview-url-batch", ok: false, value: null });
  assert.deepEqual(Object.keys(runFeature({ kind: "nope", value: {} })), ["issues", "kind", "ok", "value"]);
});

test("pure deterministic without input mutation", () => {
  const payload = { kind: "check-preview-url", value: { host: "127.0.0.1", port: 8080, protocol: "http" } };
  const first = runFeature(payload);
  const second = runFeature({ kind: "check-preview-url", value: { host: "127.0.0.1", port: 8080, protocol: "http" } });
  assert.deepEqual(first, second);
  assert.deepEqual(payload, { kind: "check-preview-url", value: { host: "127.0.0.1", port: 8080, protocol: "http" } });
});
