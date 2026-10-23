import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_validation_scope_guard.mjs";
const scopeKeys = ["advertisesDeniedPaths", "advertisesServingCheck", "advertisesSyntaxCheck", "advertisesUnsupportedWrites", "complete", "issues", "valid"];
function fullScope(overrides) {
  const base = {
    advertisesDeniedPaths: true,
    advertisesServingCheck: true,
    advertisesSyntaxCheck: true,
    advertisesUnsupportedWrites: true
  };
  return { ...base, ...overrides };
}
describe("wildbound validation scope guard", () => {
  it("all true returns complete valid empty issues", () => {
    const out = runFeature({ kind: "check-validation-scope", value: fullScope({}) });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-validation-scope");
    assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
    assert.deepEqual(Object.keys(out.value), scopeKeys);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.complete, true);
    assert.deepEqual(out.value.issues, []);
  });
  it("single false returns missing-syntax-check", () => {
    const out = runFeature({ kind: "check-validation-scope", value: fullScope({ advertisesSyntaxCheck: false }) });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.complete, false);
    assert.deepEqual(out.value.issues, ["missing-syntax-check"]);
  });
  it("all false returns four missing issues in order", () => {
    const out = runFeature({
      kind: "check-validation-scope",
      value: fullScope({ advertisesDeniedPaths: false, advertisesServingCheck: false, advertisesSyntaxCheck: false, advertisesUnsupportedWrites: false })
    });
    assert.deepEqual(out.value.issues, ["missing-denied-paths", "missing-serving-check", "missing-syntax-check", "missing-unsupported-writes"]);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.complete, false);
  });
  it("non-boolean flags return null echo and bad issues in order", () => {
    const out = runFeature({
      kind: "check-validation-scope",
      value: { advertisesDeniedPaths: "yes", advertisesServingCheck: 1, advertisesSyntaxCheck: null, advertisesUnsupportedWrites: true }
    });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.complete, false);
    assert.equal(out.value.advertisesDeniedPaths, null);
    assert.equal(out.value.advertisesServingCheck, null);
    assert.equal(out.value.advertisesSyntaxCheck, null);
    assert.equal(out.value.advertisesUnsupportedWrites, true);
    assert.deepEqual(out.value.issues, ["bad-denied-paths", "bad-serving-check", "bad-syntax-check"]);
  });
  it("single string flag example matches contract", () => {
    const out = runFeature({ kind: "check-validation-scope", value: fullScope({ advertisesDeniedPaths: "yes" }) });
    assert.deepEqual(out, {
      kind: "check-validation-scope",
      ok: true,
      value: {
        advertisesDeniedPaths: null,
        advertisesServingCheck: true,
        advertisesSyntaxCheck: true,
        advertisesUnsupportedWrites: true,
        complete: false,
        issues: ["bad-denied-paths"],
        valid: false
      }
    });
  });
  it("batch empty returns empty results", () => {
    const out = runFeature({ kind: "check-validation-scope-batch", value: { requests: [] } });
    assert.equal(out.ok, true);
    assert.deepEqual(out.value, { results: [] });
  });
  it("batch evaluates independently in order", () => {
    const out = runFeature({
      kind: "check-validation-scope-batch",
      value: {
        requests: [
          fullScope({}),
          fullScope({ advertisesDeniedPaths: false }),
          { advertisesDeniedPaths: 0, advertisesServingCheck: true, advertisesSyntaxCheck: true, advertisesUnsupportedWrites: true }
        ]
      }
    });
    assert.equal(out.ok, true);
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].complete, true);
    assert.deepEqual(out.value.results[1].issues, ["missing-denied-paths"]);
    assert.deepEqual(out.value.results[2].issues, ["bad-denied-paths"]);
    for (const r of out.value.results) {
      assert.deepEqual(Object.keys(r), scopeKeys);
    }
  });
  it("invalid payloads return ok false with single issue and ordered keys", () => {
    const badPayload = runFeature(null);
    assert.deepEqual(badPayload, { issues: ["bad-payload"], kind: "unknown", ok: false, value: null });
    assert.deepEqual(Object.keys(badPayload), ["issues", "kind", "ok", "value"]);
    const badKind = runFeature({ kind: "nope", value: {} });
    assert.deepEqual(badKind, { issues: ["bad-kind"], kind: "unknown", ok: false, value: null });
    const missingKind = runFeature({ value: {} });
    assert.deepEqual(missingKind.issues, ["bad-kind"]);
    const badValue = runFeature({ kind: "check-validation-scope", value: { advertisesDeniedPaths: true } });
    assert.deepEqual(badValue, { issues: ["bad-value"], kind: "check-validation-scope", ok: false, value: null });
    const badRequests = runFeature({ kind: "check-validation-scope-batch", value: { requests: "x" } });
    assert.deepEqual(badRequests, { issues: ["bad-requests"], kind: "check-validation-scope-batch", ok: false, value: null });
    const tooMany = runFeature({ kind: "check-validation-scope-batch", value: { requests: new Array(17).fill(fullScope({})) } });
    assert.deepEqual(tooMany.issues, ["bad-requests"]);
  });
  it("preserves input", () => {
    const payload = { kind: "check-validation-scope", value: fullScope({ advertisesServingCheck: false }) };
    const before = JSON.stringify(payload);
    runFeature(payload);
    assert.equal(JSON.stringify(payload), before);
  });
});
