import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature, checkEncryptPayload, checkEncryptPayloadBatch } from "../js/community/wildbound_encrypt_payload_guard.mjs";

const ORDERED_KEYS = ["cipher", "combined", "expectedLength", "issues", "iv", "matches", "reason", "valid"];

function iv0123() {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
}

describe("well-formed matches true", () => {
  it("contract example concatenates IV plus cipher", () => {
    const payload = { kind: "check-encrypt-payload", value: { cipher: [20, 21], combined: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 20, 21], iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] } };
    const before = JSON.stringify(payload);
    const out = runFeature(payload);
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-encrypt-payload");
    assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
    assert.deepEqual(Object.keys(out.value), ORDERED_KEYS);
    assert.equal(out.value.expectedLength, 14);
    assert.deepEqual(out.value.issues, []);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.matches, true);
    assert.equal(out.value.reason, null);
    assert.deepEqual(out.value.cipher, [20, 21]);
    assert.deepEqual(out.value.iv, iv0123());
    assert.deepEqual(out.value.combined, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 20, 21]);
    assert.equal(JSON.stringify(payload), before);
    assert.deepEqual(runFeature(payload), out);
    assert.equal(JSON.stringify(out), JSON.stringify(JSON.parse(JSON.stringify(out))));
  });
  it("empty cipher equals IV only", () => {
    const iv = iv0123();
    const out = runFeature({ kind: "check-encrypt-payload", value: { cipher: [], combined: iv.slice(), iv: iv.slice() } });
    assert.equal(out.value.expectedLength, 12);
    assert.equal(out.value.matches, true);
    assert.equal(out.value.valid, true);
    assert.deepEqual(out.value.issues, []);
    assert.equal(out.value.reason, null);
  });
});

describe("length mismatch", () => {
  it("returns length-mismatch with expectedLength sum", () => {
    const payload = { kind: "check-encrypt-payload", value: { cipher: [20, 21], combined: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 20], iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] } };
    const out = runFeature(payload);
    assert.equal(out.ok, true);
    assert.deepEqual(Object.keys(out.value), ORDERED_KEYS);
    assert.equal(out.value.expectedLength, 14);
    assert.equal(out.value.matches, false);
    assert.equal(out.value.reason, "length-mismatch");
    assert.equal(out.value.valid, true);
    assert.deepEqual(out.value.issues, []);
  });
});

describe("prefix mismatch", () => {
  it("equal length cipher tail mismatch returns prefix-mismatch", () => {
    const payload = { kind: "check-encrypt-payload", value: { cipher: [20, 21], combined: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 20, 99], iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] } };
    const out = runFeature(payload);
    assert.equal(out.value.expectedLength, 14);
    assert.equal(out.value.matches, false);
    assert.equal(out.value.reason, "prefix-mismatch");
    assert.equal(out.value.valid, true);
    assert.deepEqual(out.value.issues, []);
  });
  it("wrong IV prefix byte returns prefix-mismatch", () => {
    const payload = { kind: "check-encrypt-payload", value: { cipher: [1], combined: [9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 1], iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] } };
    const out = runFeature(payload);
    assert.equal(out.value.matches, false);
    assert.equal(out.value.reason, "prefix-mismatch");
    assert.equal(out.value.valid, true);
  });
});

describe("malformed fields", () => {
  it("non-array iv returns bad-iv example", () => {
    const out = runFeature({ kind: "check-encrypt-payload", value: { cipher: [1], combined: [1], iv: { x: 1 } } });
    assert.equal(out.ok, true);
    assert.deepEqual(Object.keys(out.value), ORDERED_KEYS);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.matches, false);
    assert.equal(out.value.reason, null);
    assert.equal(out.value.expectedLength, null);
    assert.deepEqual(out.value.issues, ["bad-iv"]);
    assert.equal(out.value.iv, null);
    assert.deepEqual(out.value.cipher, [1]);
    assert.deepEqual(out.value.combined, [1]);
  });
  it("all three bad in deterministic order with array echo", () => {
    const out = runFeature({ kind: "check-encrypt-payload", value: { cipher: "x", combined: 5, iv: [0] } });
    assert.equal(out.value.valid, false);
    assert.deepEqual(out.value.issues, ["bad-iv", "bad-cipher", "bad-combined"]);
    assert.equal(out.value.cipher, null);
    assert.equal(out.value.combined, null);
    assert.deepEqual(out.value.iv, [0]);
    assert.equal(out.value.expectedLength, null);
    assert.equal(out.value.matches, false);
    assert.equal(out.value.reason, null);
  });
  it("bad byte values and lengths", () => {
    const badIv = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 256];
    const out = runFeature({ kind: "check-encrypt-payload", value: { cipher: [300], combined: [], iv: badIv } });
    assert.deepEqual(out.value.issues, ["bad-iv", "bad-cipher"]);
    assert.equal(out.value.valid, false);
    assert.deepEqual(out.value.iv, badIv);
    assert.deepEqual(out.value.cipher, [300]);
  });
});

describe("batch", () => {
  it("evaluates in order including empty", () => {
    const good = { cipher: [20, 21], combined: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 20, 21], iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] };
    const short = { cipher: [20, 21], combined: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 20], iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] };
    const bad = { cipher: [1], combined: [1], iv: { x: 1 } };
    const out = runFeature({ kind: "check-encrypt-payload-batch", value: { requests: [good, short, bad] } });
    assert.equal(out.ok, true);
    assert.equal(out.kind, "check-encrypt-payload-batch");
    assert.equal(out.value.results.length, 3);
    assert.equal(out.value.results[0].matches, true);
    assert.equal(out.value.results[1].reason, "length-mismatch");
    assert.deepEqual(out.value.results[2].issues, ["bad-iv"]);
    for (const r of out.value.results) {
      assert.deepEqual(Object.keys(r), ORDERED_KEYS);
    }
    const empty = runFeature({ kind: "check-encrypt-payload-batch", value: { requests: [] } });
    assert.deepEqual(empty.value.results, []);
    assert.equal(empty.ok, true);
  });
});

describe("invalid envelopes", () => {
  it("bad-kind uses unknown", () => {
    const out = runFeature({ kind: "nope", value: {} });
    assert.equal(out.ok, false);
    assert.equal(out.kind, "unknown");
    assert.equal(out.value, null);
    assert.deepEqual(out.issues, ["bad-kind"]);
    assert.deepEqual(Object.keys(out), ["issues", "kind", "ok", "value"]);
  });
  it("bad-payload for non-objects", () => {
    const cases = [null, 5, "x"];
    for (const p of cases) {
      const out = runFeature(p);
      assert.equal(out.ok, false);
      assert.deepEqual(out.issues, ["bad-payload"]);
      assert.equal(out.kind, "unknown");
    }
    const outArr = runFeature([]);
    assert.deepEqual(outArr.issues, ["bad-payload"]);
  });
  it("bad-value for single and batch value shape", () => {
    const a = runFeature({ kind: "check-encrypt-payload", value: { cipher: [] } });
    assert.deepEqual(a.issues, ["bad-value"]);
    assert.equal(a.kind, "check-encrypt-payload");
    assert.equal(a.value, null);
    const b = runFeature({ kind: "check-encrypt-payload-batch", value: { nope: [] } });
    assert.deepEqual(b.issues, ["bad-value"]);
  });
  it("bad-requests for bad requests array", () => {
    const a = runFeature({ kind: "check-encrypt-payload-batch", value: { requests: "x" } });
    assert.deepEqual(a.issues, ["bad-requests"]);
    assert.equal(a.kind, "check-encrypt-payload-batch");
    const many = [];
    for (const n of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]) {
      many.push({ cipher: [], combined: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] });
    }
    assert.equal(many.length, 17);
    const b = runFeature({ kind: "check-encrypt-payload-batch", value: { requests: many } });
    assert.deepEqual(b.issues, ["bad-requests"]);
    const c = runFeature({ kind: "check-encrypt-payload-batch", value: { requests: [{ cipher: [] }] } });
    assert.deepEqual(c.issues, ["bad-requests"]);
  });
});

describe("helpers and purity", () => {
  it("helpers are pure JSON to JSON", () => {
    const v = { cipher: [20, 21], combined: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 20, 21], iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] };
    const before = JSON.stringify(v);
    const r1 = checkEncryptPayload(v);
    const r2 = checkEncryptPayload(JSON.parse(before));
    assert.deepEqual(r1, r2);
    assert.equal(JSON.stringify(v), before);
    const arr = [v, v];
    const b1 = checkEncryptPayloadBatch(arr);
    assert.equal(b1.length, 2);
    assert.equal(b1[0].matches, true);
    assert.equal(JSON.stringify(arr), JSON.stringify([v, v]));
  });
});
