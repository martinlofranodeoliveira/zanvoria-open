export function checkEncryptSize(valueInput) {
  const plain = isPlainObject(valueInput);
  const rawCipher = plain === true ? valueInput.cipherLen : null;
  const rawIv = plain === true ? valueInput.ivLen : null;
  const cipherValid = isValidCipherLen(rawCipher);
  const ivValid = isValidIvLen(rawIv);
  const bothValid = cipherValid === true && ivValid === true;
  if (bothValid === true) {
    const rawLen = rawIv + rawCipher;
    const encodedLen = 4 * Math.ceil(rawLen / 3);
    const allowed = rawIv === 12;
    const issues = buildValidIssues(rawIv);
    const ordered = [];
    ordered.push(["allowed", allowed]);
    ordered.push(["cipherLen", rawCipher]);
    ordered.push(["encodedLen", encodedLen]);
    ordered.push(["issues", issues]);
    ordered.push(["ivLen", rawIv]);
    ordered.push(["rawLen", rawLen]);
    ordered.push(["valid", true]);
    return Object.fromEntries(ordered);
  }
  const cipherOut = cipherValid === true ? rawCipher : null;
  const ivOut = ivValid === true ? rawIv : null;
  const badIssues = buildInvalidIssues(cipherValid, ivValid);
  const badOrdered = [];
  badOrdered.push(["allowed", false]);
  badOrdered.push(["cipherLen", cipherOut]);
  badOrdered.push(["encodedLen", null]);
  badOrdered.push(["issues", badIssues]);
  badOrdered.push(["ivLen", ivOut]);
  badOrdered.push(["rawLen", null]);
  badOrdered.push(["valid", false]);
  return Object.fromEntries(badOrdered);
}
export function checkEncryptSizeBatch(batchInput) {
  if (Array.isArray(batchInput) === true) {
    const results = [];
    for (const item of batchInput) {
      results.push(checkEncryptSize(item));
    }
    const out = [];
    out.push(["results", results]);
    return Object.fromEntries(out);
  }
  if (hasExactlyRequestsKey(batchInput) === false) {
    return null;
  }
  const reqs = batchInput.requests;
  if (Array.isArray(reqs) === false) {
    return null;
  }
  const inner = [];
  for (const item of reqs) {
    inner.push(checkEncryptSize(item));
  }
  const wrapped = [];
  wrapped.push(["results", inner]);
  return Object.fromEntries(wrapped);
}
export function runFeature(payload) {
  if (isPlainObject(payload) === false) {
    const issues = [];
    issues.push("bad-payload");
    const entries = [];
    entries.push(["issues", issues]);
    entries.push(["kind", "unknown"]);
    entries.push(["ok", false]);
    entries.push(["value", null]);
    return Object.fromEntries(entries);
  }
  const kind = payload.kind;
  const value = payload.value;
  if (kind !== "check-encrypt-size" && kind !== "check-encrypt-size-batch") {
    const badKindIssues = [];
    badKindIssues.push("bad-kind");
    const badKindEntries = [];
    badKindEntries.push(["issues", badKindIssues]);
    badKindEntries.push(["kind", "unknown"]);
    badKindEntries.push(["ok", false]);
    badKindEntries.push(["value", null]);
    return Object.fromEntries(badKindEntries);
  }
  if (kind === "check-encrypt-size") {
    if (hasExactlyCipherIvKeys(value) === false) {
      const badValueIssues = [];
      badValueIssues.push("bad-value");
      return {
        issues: badValueIssues,
        kind: kind,
        ok: false,
        value: null
      };
    }
    const single = checkEncryptSize(value);
    const singleOuter = [];
    singleOuter.push(["kind", kind]);
    singleOuter.push(["ok", true]);
    singleOuter.push(["value", single]);
    return Object.fromEntries(singleOuter);
  }
  if (hasExactlyRequestsKey(value) === false) {
    const badReqIssues = [];
    badReqIssues.push("bad-requests");
    return {
      issues: badReqIssues,
      kind: kind,
      ok: false,
      value: null
    };
  }
  const reqs = value.requests;
  if (hasValidRequestsArray(reqs) === false) {
    const badReqIssues2 = [];
    badReqIssues2.push("bad-requests");
    return {
      issues: badReqIssues2,
      kind: kind,
      ok: false,
      value: null
    };
  }
  const results = [];
  for (const item of reqs) {
    results.push(checkEncryptSize(item));
  }
  const innerEntries = [];
  innerEntries.push(["results", results]);
  const batchValue = Object.fromEntries(innerEntries);
  const batchOuter = [];
  batchOuter.push(["kind", kind]);
  batchOuter.push(["ok", true]);
  batchOuter.push(["value", batchValue]);
  return Object.fromEntries(batchOuter);
}
function isPlainObject(input) {
  if (typeof input !== "object") {
    return false;
  }
  if (input === null) {
    return false;
  }
  if (Array.isArray(input) === true) {
    return false;
  }
  return true;
}
function isValidCipherLen(input) {
  if (Number.isSafeInteger(input) === false) {
    return false;
  }
  if (input < 0) {
    return false;
  }
  if (input > 1024) {
    return false;
  }
  return true;
}
function isValidIvLen(input) {
  if (Number.isSafeInteger(input) === false) {
    return false;
  }
  if (input < 0) {
    return false;
  }
  if (input > 64) {
    return false;
  }
  return true;
}
function hasExactlyCipherIvKeys(input) {
  if (isPlainObject(input) === false) {
    return false;
  }
  const keys = [];
  for (const [key, val] of Object.entries(input)) {
    keys.push(key);
  }
  if (keys.length !== 2) {
    return false;
  }
  const found = [];
  for (const k of keys) {
    if (k === "cipherLen") {
      found.push(k);
    }
    if (k === "ivLen") {
      found.push(k);
    }
  }
  if (found.length !== 2) {
    return false;
  }
  return true;
}
function hasExactlyRequestsKey(input) {
  if (isPlainObject(input) === false) {
    return false;
  }
  const keys = [];
  for (const [key, val] of Object.entries(input)) {
    keys.push(key);
  }
  if (keys.length !== 1) {
    return false;
  }
  const found = [];
  for (const k of keys) {
    if (k === "requests") {
      found.push(k);
    }
  }
  if (found.length !== 1) {
    return false;
  }
  return true;
}
function hasValidRequestsArray(input) {
  if (Array.isArray(input) === false) {
    return false;
  }
  if (input.length > 16) {
    return false;
  }
  for (const item of input) {
    if (hasExactlyCipherIvKeys(item) === false) {
      return false;
    }
  }
  return true;
}
function buildValidIssues(ivLen) {
  const issues = [];
  if (ivLen !== 12) {
    issues.push("nonstandard-iv");
  }
  return issues;
}
function buildInvalidIssues(cipherValid, ivValid) {
  const issues = [];
  if (cipherValid === false) {
    issues.push("bad-cipherLen");
  }
  if (ivValid === false) {
    issues.push("bad-ivLen");
  }
  return issues;
}
