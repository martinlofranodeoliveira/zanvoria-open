import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature, checkNpmScript, checkNpmScriptBatch } from "../js/community/wildbound_npm_script_guard.mjs";
function assertOrderedKeys(obj, expected) {
  assert.deepEqual(Object.keys(obj), expected);
}
describe("wildbound npm script guard", () => {
  it("check-npm-script with script check returns allowed true", () => {
    const out = runFeature({kind: "check-npm-script", value: {script: "check"}});
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-npm-script");
    assert.equal(out.value.valid, true);
    assert.equal(out.value.allowed, true);
    assert.equal(out.value.reason, null);
    assert.deepEqual(out.value.issues, []);
    assert.equal(out.value.script, "check");
    assertOrderedKeys(out, ["kind", "ok", "value"]);
    assertOrderedKeys(out.value, ["allowed", "issues", "reason", "script", "valid"]);
  });
  it("check-npm-script with script test and start are allowed", () => {
    const a = runFeature({kind: "check-npm-script", value: {script: "test"}});
    assert.equal(a.value.allowed, true);
    assert.equal(a.value.reason, null);
    assert.equal(a.value.valid, true);
    const b = runFeature({kind: "check-npm-script", value: {script: "start"}});
    assert.equal(b.value.allowed, true);
    assert.equal(b.value.reason, null);
  });
  it("check-npm-script with script deploy returns unknown-script", () => {
    const out = runFeature({kind: "check-npm-script", value: {script: "deploy"}});
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-npm-script");
    assert.equal(out.value.valid, true);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.reason, "unknown-script");
    assert.deepEqual(out.value.issues, []);
    assert.equal(out.value.script, "deploy");
    assertOrderedKeys(out.value, ["allowed", "issues", "reason", "script", "valid"]);
  });
  it("check-npm-script with non-string script returns bad-script", () => {
    const out = runFeature({kind: "check-npm-script", value: {script: {x: 1}}});
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-npm-script");
    assert.equal(out.value.valid, false);
    assert.equal(out.value.allowed, false);
    assert.equal(out.value.reason, null);
    assert.deepEqual(out.value.issues, ["bad-script"]);
    assert.equal(out.value.script, null);
  });
  it("check-npm-script rejects bad characters and lengths with bad-script", () => {
    const badExcl = runFeature({kind: "check-npm-script", value: {script: "bad!"}});
    assert.equal(badExcl.value.valid, false);
    assert.deepEqual(badExcl.value.issues, ["bad-script"]);
    const empty = runFeature({kind: "check-npm-script", value: {script: ""}});
    assert.equal(empty.value.valid, false);
    const num = runFeature({kind: "check-npm-script", value: {script: 7}});
    assert.equal(num.value.valid, false);
    assert.equal(num.value.script, null);
    const hyphenOk = runFeature({kind: "check-npm-script", value: {script: "my-script_ok"}});
    assert.equal(hyphenOk.value.valid, true);
    assert.equal(hyphenOk.value.allowed, false);
    assert.equal(hyphenOk.value.reason, "unknown-script");
  });
  it("check-npm-script malformed value returns bad-value", () => {
    const extra = runFeature({kind: "check-npm-script", value: {script: "check", extra: 1}});
    assert.equal(extra.ok, false);
    assert.equal(extra.kind, "check-npm-script");
    assert.equal(extra.value, null);
    assert.deepEqual(extra.issues, ["bad-value"]);
    const missing = runFeature({kind: "check-npm-script", value: {}});
    assert.equal(missing.ok, false);
    assert.deepEqual(missing.issues, ["bad-value"]);
  });
  it("check-npm-script-batch evaluates each request in order with five ordered keys", () => {
    const payload = {kind: "check-npm-script-batch", value: {requests: [{script: "check"}, {script: "deploy"}, {script: 5}]}};
    const out = runFeature(payload);
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-npm-script-batch");
    assertOrderedKeys(out, ["kind", "ok", "value"]);
    assertOrderedKeys(out.value, ["results"]);
    assert.equal(out.value.results.length, 3);
    for (const r of out.value.results) {
      assertOrderedKeys(r, ["allowed", "issues", "reason", "script", "valid"]);
    }
    assert.equal(out.value.results[0].script, "check");
    assert.equal(out.value.results[0].allowed, true);
    assert.equal(out.value.results[0].valid, true);
    assert.equal(out.value.results[1].script, "deploy");
    assert.equal(out.value.results[1].allowed, false);
    assert.equal(out.value.results[1].reason, "unknown-script");
    assert.equal(out.value.results[2].valid, false);
    assert.deepEqual(out.value.results[2].issues, ["bad-script"]);
    assert.equal(out.value.results[2].script, null);
  });
  it("check-npm-script-batch empty and bad-requests handling", () => {
    const empty = runFeature({kind: "check-npm-script-batch", value: {requests: []}});
    assert.equal(empty.ok, true);
    assert.deepEqual(empty.value.results, []);
    const bad = runFeature({kind: "check-npm-script-batch", value: {script: "check"}});
    assert.equal(bad.ok, false);
    assert.deepEqual(bad.issues, ["bad-requests"]);
    assert.equal(bad.value, null);
    const notArray = runFeature({kind: "check-npm-script-batch", value: {requests: "check"}});
    assert.equal(notArray.ok, false);
    assert.deepEqual(notArray.issues, ["bad-requests"]);
  });
  it("unknown kind returns ok false with kind unknown and bad-kind", () => {
    const out = runFeature({kind: "nope", value: {script: "check"}});
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-kind"]);
    assertOrderedKeys(out, ["issues", "kind", "ok", "value"]);
    const missing = runFeature({value: {script: "check"}});
    assert.equal(missing.ok, false);
    assert.equal(missing.kind, "unknown");
    const badPayload = runFeature(null);
    assert.equal(badPayload.ok, false);
    assert.equal(badPayload.kind, "unknown");
    assert.deepEqual(badPayload.issues, ["bad-payload"]);
  });
  it("runFeature preserves input and is deterministic with ordered keys", () => {
    const payload = {kind: "check-npm-script", value: {script: "check"}};
    const snapshot = JSON.parse(JSON.stringify(payload));
    const first = runFeature(payload);
    const second = runFeature(payload);
    assert.deepEqual(payload, snapshot);
    assert.deepEqual(first, second);
    assert.deepEqual(first, {kind: "check-npm-script", ok: true, value: {allowed: true, issues: [], reason: null, script: "check", valid: true}});
    const batch = {kind: "check-npm-script-batch", value: {requests: [{script: "start"}]}};
    const batchSnap = JSON.parse(JSON.stringify(batch));
    runFeature(batch);
    assert.deepEqual(batch, batchSnap);
  });
  it("helpers are pure functions without I/O or callbacks", () => {
    assert.equal(typeof checkNpmScript, "function");
    assert.equal(typeof checkNpmScriptBatch, "function");
    const r = checkNpmScript({script: "check"});
    assert.equal(r.allowed, true);
    assertOrderedKeys(r, ["allowed", "issues", "reason", "script", "valid"]);
    const arr = checkNpmScriptBatch({requests: [{script: "check"}, {script: "deploy"}]});
    assert.equal(arr.length, 2);
    assert.equal(arr[0].allowed, true);
    assert.equal(arr[1].reason, "unknown-script");
    const src = runFeature.toString() + checkNpmScript.toString() + checkNpmScriptBatch.toString();
    assert.equal(src.includes("Object.entries"), true);
    assert.equal(src.includes("Object.fromEntries"), true);
    assert.equal(src.includes(".push("), true);
    assert.equal(src.includes("for ("), true);
    for (const bad of ["prototype", "constructor", "Object.assign", "Object.create"]) {
      assert.equal(src.includes(bad), false);
    }
  });
});
