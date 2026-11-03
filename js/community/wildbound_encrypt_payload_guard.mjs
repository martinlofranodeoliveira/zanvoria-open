export function checkEncryptPayload(inner) {
  if (isPlainObject(inner) === false) {
    const iss0 = [];
    iss0.push("bad-iv");
    iss0.push("bad-cipher");
    iss0.push("bad-combined");
    const parts0 = [];
    parts0.push(makeEntry("cipher", null));
    parts0.push(makeEntry("combined", null));
    parts0.push(makeEntry("expectedLength", null));
    parts0.push(makeEntry("issues", iss0));
    parts0.push(makeEntry("iv", null));
    parts0.push(makeEntry("matches", false));
    parts0.push(makeEntry("reason", null));
    parts0.push(makeEntry("valid", false));
    return Object.fromEntries(parts0);
  }
  const cipherVal = inner.cipher;
  const combinedVal = inner.combined;
  const ivVal = inner.iv;
  const ivOk = Array.isArray(ivVal) === true && ivVal.length === 12 && bytesOk(ivVal) === true;
  const cipherOk = Array.isArray(cipherVal) === true && cipherVal.length >= 0 && cipherVal.length <= 64 && bytesOk(cipherVal) === true;
  const combinedOk = Array.isArray(combinedVal) === true && combinedVal.length >= 0 && combinedVal.length <= 76 && bytesOk(combinedVal) === true;
  const allOk = ivOk === true && cipherOk === true && combinedOk === true;
  if (allOk === true) {
    const expectedLength = 12 + cipherVal.length;
    const joined = [];
    for (const b of ivVal) {
      joined.push(b);
    }
    for (const b of cipherVal) {
      joined.push(b);
    }
    const expected = new Map();
    for (const entry of Object.entries(joined)) {
      const idx = entry[0];
      const byte = entry[1];
      expected.set(idx, byte);
    }
    const lenOk = combinedVal.length === expectedLength;
    const diffs = [];
    for (const entry of Object.entries(combinedVal)) {
      const idx = entry[0];
      const byte = entry[1];
      const want = expected.get(idx);
      if (want !== byte) {
        diffs.push(idx);
      }
    }
    const matches = lenOk === true && diffs.length === 0;
    const reason = matches === true ? null : lenOk === false ? "length-mismatch" : "prefix-mismatch";
    const cipherCopy = [];
    for (const b of cipherVal) {
      cipherCopy.push(b);
    }
    const combinedCopy = [];
    for (const b of combinedVal) {
      combinedCopy.push(b);
    }
    const ivCopy = [];
    for (const b of ivVal) {
      ivCopy.push(b);
    }
    const emptyIssues = [];
    const parts = [];
    parts.push(makeEntry("cipher", cipherCopy));
    parts.push(makeEntry("combined", combinedCopy));
    parts.push(makeEntry("expectedLength", expectedLength));
    parts.push(makeEntry("issues", emptyIssues));
    parts.push(makeEntry("iv", ivCopy));
    parts.push(makeEntry("matches", matches));
    parts.push(makeEntry("reason", reason));
    parts.push(makeEntry("valid", true));
    return Object.fromEntries(parts);
  }
  const issues = [];
  if (ivOk === false) {
    issues.push("bad-iv");
  }
  if (cipherOk === false) {
    issues.push("bad-cipher");
  }
  if (combinedOk === false) {
    issues.push("bad-combined");
  }
  const cipherEcho = copyOrNull(cipherVal);
  const combinedEcho = copyOrNull(combinedVal);
  const ivEcho = copyOrNull(ivVal);
  const badParts = [];
  badParts.push(makeEntry("cipher", cipherEcho));
  badParts.push(makeEntry("combined", combinedEcho));
  badParts.push(makeEntry("expectedLength", null));
  badParts.push(makeEntry("issues", issues));
  badParts.push(makeEntry("iv", ivEcho));
  badParts.push(makeEntry("matches", false));
  badParts.push(makeEntry("reason", null));
  badParts.push(makeEntry("valid", false));
  return Object.fromEntries(badParts);
}
export function checkEncryptPayloadBatch(requests) {
  if (Array.isArray(requests) === false) {
    const empty = [];
    return empty;
  }
  const results = [];
  for (const r of requests) {
    results.push(checkEncryptPayload(r));
  }
  return results;
}
export function runFeature(payload) {
  if (isPlainObject(payload) === false) {
    const iss = [];
    iss.push("bad-payload");
    return {
      issues: iss,
      kind: "unknown",
      ok: false,
      value: null
    };
  }
  const kindVal = payload.kind;
  const valueVal = payload.value;
  if (kindVal !== "check-encrypt-payload" && kindVal !== "check-encrypt-payload-batch") {
    const iss2 = [];
    iss2.push("bad-kind");
    return {
      issues: iss2,
      kind: "unknown",
      ok: false,
      value: null
    };
  }
  if (kindVal === "check-encrypt-payload") {
    if (isPlainObject(valueVal) === false || hasExactCipherKeys(valueVal) === false) {
      const iss3 = [];
      iss3.push("bad-value");
      return {
        issues: iss3,
        kind: kindVal,
        ok: false,
        value: null
      };
    }
    const inner = checkEncryptPayload(valueVal);
    return {
      kind: kindVal,
      ok: true,
      value: inner
    };
  }
  if (isPlainObject(valueVal) === false || hasExactRequestsKey(valueVal) === false) {
    const iss4 = [];
    iss4.push("bad-value");
    return {
      issues: iss4,
      kind: kindVal,
      ok: false,
      value: null
    };
  }
  const reqs = valueVal.requests;
  if (Array.isArray(reqs) === false) {
    const iss5 = [];
    iss5.push("bad-requests");
    return {
      issues: iss5,
      kind: kindVal,
      ok: false,
      value: null
    };
  }
  if (reqs.length > 16) {
    const iss6 = [];
    iss6.push("bad-requests");
    return {
      issues: iss6,
      kind: kindVal,
      ok: false,
      value: null
    };
  }
  const badShape = [];
  for (const r of reqs) {
    if (hasExactCipherKeys(r) === false) {
      badShape.push(r);
    }
  }
  if (badShape.length !== 0) {
    const iss7 = [];
    iss7.push("bad-requests");
    return {
      issues: iss7,
      kind: kindVal,
      ok: false,
      value: null
    };
  }
  const results = checkEncryptPayloadBatch(reqs);
  const vp = [];
  vp.push(makeEntry("results", results));
  const batchVal = Object.fromEntries(vp);
  return {
    kind: kindVal,
    ok: true,
    value: batchVal
  };
}
function isPlainObject(v) {
  if (typeof v !== "object") {
    return false;
  }
  if (v === null) {
    return false;
  }
  if (Array.isArray(v) === true) {
    return false;
  }
  return true;
}
function isByte(v) {
  if (typeof v !== "number") {
    return false;
  }
  if (Number.isFinite(v) === false) {
    return false;
  }
  if (Number.isSafeInteger(v) === false) {
    return false;
  }
  if (v < 0) {
    return false;
  }
  if (v > 255) {
    return false;
  }
  return true;
}
function bytesOk(arr) {
  const bad = [];
  for (const b of arr) {
    if (isByte(b) === false) {
      bad.push(b);
    }
  }
  return bad.length === 0;
}
function copyOrNull(v) {
  if (Array.isArray(v) === false) {
    return null;
  }
  const out = [];
  for (const b of v) {
    out.push(b);
  }
  return out;
}
function makeEntry(k, v) {
  const e = [];
  e.push(k);
  e.push(v);
  return e;
}
function hasExactCipherKeys(v) {
  if (isPlainObject(v) === false) {
    return false;
  }
  const entries = Object.entries(v);
  if (entries.length !== 3) {
    return false;
  }
  const found = [];
  for (const entry of entries) {
    const k = entry[0];
    if (k === "cipher" || k === "combined" || k === "iv") {
      found.push(k);
    }
  }
  return found.length === 3;
}
function hasExactRequestsKey(v) {
  if (isPlainObject(v) === false) {
    return false;
  }
  const entries = Object.entries(v);
  if (entries.length !== 1) {
    return false;
  }
  for (const entry of entries) {
    const k = entry[0];
    if (k !== "requests") {
      return false;
    }
  }
  return true;
}
