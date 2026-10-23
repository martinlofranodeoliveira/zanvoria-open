import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_notice_separation_guard.mjs";
const SINGLE_KEYS = ["advertisesExcludedNoRedistribution", "advertisesHistorySeparate", "advertisesNoticeReference", "advertisesPrivatePreserved", "complete", "issues", "valid"];
function singleInput(overrides) {
  const base = {
    advertisesExcludedNoRedistribution: true,
    advertisesHistorySeparate: true,
    advertisesNoticeReference: true,
    advertisesPrivatePreserved: true
  };
  const out = {
    advertisesExcludedNoRedistribution: base.advertisesExcludedNoRedistribution,
    advertisesHistorySeparate: base.advertisesHistorySeparate,
    advertisesNoticeReference: base.advertisesNoticeReference,
    advertisesPrivatePreserved: base.advertisesPrivatePreserved
  };
  if (overrides !== undefined) {
    for (const entry of Object.entries(overrides)) {
      const k = entry[0];
      if (k === "advertisesExcludedNoRedistribution") {
        out.advertisesExcludedNoRedistribution = overrides.advertisesExcludedNoRedistribution;
      }
      if (k === "advertisesHistorySeparate") {
        out.advertisesHistorySeparate = overrides.advertisesHistorySeparate;
      }
      if (k === "advertisesNoticeReference") {
        out.advertisesNoticeReference = overrides.advertisesNoticeReference;
      }
      if (k === "advertisesPrivatePreserved") {
        out.advertisesPrivatePreserved = overrides.advertisesPrivatePreserved;
      }
    }
  }
  return out;
}
describe("wildbound notice separation guard", () => {
  it("all-true returns complete true with empty issues", () => {
    const payload = { kind: "check-notice-separation", value: singleInput() };
    const before = JSON.stringify(payload);
    const out = runFeature(payload);
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-notice-separation");
    assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
    assert.deepEqual(Object.keys(out.value), SINGLE_KEYS);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.complete, true);
    assert.deepEqual(out.value.issues, []);
    assert.equal(JSON.stringify(payload), before);
  });
  it("single false flag returns deterministic missing issue", () => {
    const payload = { kind: "check-notice-separation", value: singleInput({ advertisesNoticeReference: false }) };
    const out = runFeature(payload);
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.complete, false);
    assert.deepEqual(out.value.issues, ["missing-notice-reference"]);
    assert.deepEqual(Object.keys(out.value), SINGLE_KEYS);
  });
  it("all false flags return four missing issues in order", () => {
    const payload = {
      kind: "check-notice-separation",
      value: {
        advertisesExcludedNoRedistribution: false,
        advertisesHistorySeparate: false,
        advertisesNoticeReference: false,
        advertisesPrivatePreserved: false
      }
    };
    const out = runFeature(payload);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.complete, false);
    assert.deepEqual(out.value.issues, ["missing-excluded-no-redistribution", "missing-history-separate", "missing-notice-reference", "missing-private-preserved"]);
  });
  it("malformed flag returns valid false with null and bad issue", () => {
    const payload = {
      kind: "check-notice-separation",
      value: {
        advertisesExcludedNoRedistribution: true,
        advertisesHistorySeparate: true,
        advertisesNoticeReference: true,
        advertisesPrivatePreserved: "yes"
      }
    };
    const out = runFeature(payload);
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.complete, false);
    assert.equal(out.value.advertisesPrivatePreserved, null);
    assert.deepEqual(out.value.issues, ["bad-private-preserved"]);
  });
  it("multiple malformed flags return ordered bad issues", () => {
    const payload = {
      kind: "check-notice-separation",
      value: {
        advertisesExcludedNoRedistribution: 1,
        advertisesHistorySeparate: true,
        advertisesNoticeReference: null,
        advertisesPrivatePreserved: 0
      }
    };
    const out = runFeature(payload);
    assert.equal(out.value.valid, false);
    assert.deepEqual(out.value.issues, ["bad-excluded-no-redistribution", "bad-notice-reference", "bad-private-preserved"]);
    assert.equal(out.value.advertisesExcludedNoRedistribution, null);
    assert.equal(out.value.advertisesNoticeReference, null);
  });
  it("batch empty returns empty results", () => {
    const out = runFeature({ kind: "check-notice-separation-batch", value: { requests: [] } });
    assert.equal(out.ok, true);
    assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
    assert.deepEqual(Object.keys(out.value), ["results"]);
    assert.deepEqual(out.value.results, []);
  });
  it("batch evaluates each independently in order", () => {
    const payload = {
      kind: "check-notice-separation-batch",
      value: {
        requests: [
          singleInput(),
          {
            advertisesExcludedNoRedistribution: false,
            advertisesHistorySeparate: true,
            advertisesNoticeReference: true,
            advertisesPrivatePreserved: true
          },
          {
            advertisesExcludedNoRedistribution: true,
            advertisesHistorySeparate: true,
            advertisesNoticeReference: true,
            advertisesPrivatePreserved: "yes"
          }
        ]
      }
    };
    const before = JSON.stringify(payload);
    const out = runFeature(payload);
    assert.equal(out.ok, true);
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].complete, true);
    assert.deepEqual(out.value.results[0].issues, []);
    assert.deepEqual(out.value.results[1].issues, ["missing-excluded-no-redistribution"]);
    assert.equal(out.value.results[1].valid, true);
    assert.deepEqual(out.value.results[2].issues, ["bad-private-preserved"]);
    assert.equal(out.value.results[2].valid, false);
    for (const r of out.value.results) {
      assert.deepEqual(Object.keys(r), SINGLE_KEYS);
    }
    assert.equal(JSON.stringify(payload), before);
  });
  it("unknown kind returns bad-kind with unknown", () => {
    const out = runFeature({ kind: "nope", value: {} });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-kind"]);
    assert.deepEqual(Object.keys(out), ["issues", "kind", "ok", "value"]);
  });
  it("non-object payload returns bad-payload", () => {
    const a = runFeature(null);
    assert.deepEqual(a.issues, ["bad-payload"]);
    assert.equal(a.kind, "unknown");
    assert.equal(a.value, null);
    const b = runFeature("x");
    assert.deepEqual(b.issues, ["bad-payload"]);
  });
  it("malformed single value returns bad-value", () => {
    const out = runFeature({ kind: "check-notice-separation", value: { advertisesHistorySeparate: true } });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "check-notice-separation");
    assert.deepEqual(out.issues, ["bad-value"]);
    assert.equal(out.value, null);
  });
  it("malformed batch value returns bad-requests", () => {
    const out = runFeature({ kind: "check-notice-separation-batch", value: { requests: "no" } });
    assert.equal(out.ok, false);
    assert.deepEqual(out.issues, ["bad-requests"]);
    const out2 = runFeature({
      kind: "check-notice-separation-batch",
      value: { requests: [{ advertisesHistorySeparate: true }] }
    });
    assert.deepEqual(out2.issues, ["bad-requests"]);
  });
  it("batch over 16 returns bad-requests", () => {
    const requests = [];
    for (const n of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]) {
      requests.push(singleInput());
    }
    assert.equal(requests.length, 17);
    const out = runFeature({ kind: "check-notice-separation-batch", value: { requests: requests } });
    assert.equal(out.ok, false);
    assert.deepEqual(out.issues, ["bad-requests"]);
  });
  it("is deterministic and preserves input", () => {
    const payload = { kind: "check-notice-separation", value: singleInput({ advertisesHistorySeparate: false }) };
    const first = runFeature(payload);
    const second = runFeature(payload);
    assert.deepEqual(first, second);
    assert.deepEqual(JSON.stringify(first), JSON.stringify(second));
  });
});
