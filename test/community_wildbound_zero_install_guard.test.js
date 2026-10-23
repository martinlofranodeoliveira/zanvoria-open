import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_zero_install_guard.mjs";

describe("wildbound zero-install guard", () => {
  it("complete case returns valid true complete true empty issues", () => {
    const out = runFeature({ kind: "check-zero-install", value: { advertisesNoCredentials: true, advertisesNoPackageInstall: true } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-zero-install");
    assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
    assert.deepEqual(Object.keys(out.value), ["advertisesNoCredentials", "advertisesNoPackageInstall", "complete", "issues", "valid"]);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.complete, true);
    assert.deepEqual(out.value.issues, []);
  });
  it("incomplete single false returns missing issue in order", () => {
    const out = runFeature({ kind: "check-zero-install", value: { advertisesNoCredentials: true, advertisesNoPackageInstall: false } });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.complete, false);
    assert.deepEqual(out.value.issues, ["missing-no-package-install"]);
    const out2 = runFeature({ kind: "check-zero-install", value: { advertisesNoCredentials: false, advertisesNoPackageInstall: false } });
    assert.deepEqual(out2.value.issues, ["missing-no-credentials", "missing-no-package-install"]);
  });
  it("malformed non-boolean returns valid false null echo bad issues", () => {
    const out = runFeature({ kind: "check-zero-install", value: { advertisesNoCredentials: "yes", advertisesNoPackageInstall: true } });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.complete, false);
    assert.equal(out.value.advertisesNoCredentials, null);
    assert.equal(out.value.advertisesNoPackageInstall, true);
    assert.deepEqual(out.value.issues, ["bad-no-credentials"]);
    const out2 = runFeature({ kind: "check-zero-install", value: { advertisesNoCredentials: 1, advertisesNoPackageInstall: 0 } });
    assert.deepEqual(out2.value.issues, ["bad-no-credentials", "bad-no-package-install"]);
    assert.equal(out2.value.advertisesNoCredentials, null);
    assert.equal(out2.value.advertisesNoPackageInstall, null);
  });
  it("batch evaluates each independently in order", () => {
    const out = runFeature({ kind: "check-zero-install-batch", value: { requests: [{ advertisesNoCredentials: true, advertisesNoPackageInstall: true }, { advertisesNoCredentials: true, advertisesNoPackageInstall: false }, { advertisesNoCredentials: "x", advertisesNoPackageInstall: true }] } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-zero-install-batch");
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].complete, true);
    assert.equal(out.value.results[0].valid, true);
    assert.deepEqual(out.value.results[1].issues, ["missing-no-package-install"]);
    assert.deepEqual(out.value.results[2].issues, ["bad-no-credentials"]);
    assert.equal(out.value.results[2].valid, false);
    for (const r of out.value.results) {
      assert.deepEqual(Object.keys(r), ["advertisesNoCredentials", "advertisesNoPackageInstall", "complete", "issues", "valid"]);
    }
  });
  it("batch empty and max boundaries", () => {
    const empty = runFeature({ kind: "check-zero-install-batch", value: { requests: [] } });
    assert.equal(empty.ok, true);
    assert.deepEqual(empty.value.results, []);
  });
  it("invalid envelopes return ok false ordered keys single issue", () => {
    const a = runFeature({ kind: "nope", value: {} });
    assert.equal(a.ok, false);
    assert.equal(a.kind, "unknown");
    assert.deepEqual(Object.keys(a), ["issues", "kind", "ok", "value"]);
    assert.deepEqual(a.issues, ["bad-kind"]);
    const b = runFeature(null);
    assert.deepEqual(b.issues, ["bad-payload"]);
    assert.equal(b.value, null);
    const c = runFeature({ kind: "check-zero-install", value: { advertisesNoCredentials: true } });
    assert.equal(c.ok, false);
    assert.deepEqual(c.issues, ["bad-value"]);
    const d = runFeature({ kind: "check-zero-install-batch", value: { requests: "bad" } });
    assert.equal(d.ok, false);
    assert.deepEqual(d.issues, ["bad-requests"]);
  });
  it("preserves input", () => {
    const payload = { kind: "check-zero-install", value: { advertisesNoCredentials: true, advertisesNoPackageInstall: true } };
    const before = JSON.stringify(payload);
    runFeature(payload);
    assert.equal(JSON.stringify(payload), before);
  });
});
