function isPlainObject(v) {
  if (v === null) {
    return false;
  }
  if (typeof v !== "object") {
    return false;
  }
  if (Array.isArray(v)) {
    return false;
  }
  return true;
}
function isAlgorithmWellFormed(v) {
  if (typeof v !== "string") {
    return false;
  }
  if (v.length < 1) {
    return false;
  }
  if (v.length > 32) {
    return false;
  }
  for (const ch of v) {
    if (ch !== "-") {
      if (ch < "A") {
        return false;
      }
      if (ch > "Z") {
        return false;
      }
    }
  }
  return true;
}
function isKeyUsageWellFormed(v) {
  if (typeof v !== "string") {
    return false;
  }
  if (v.length < 1) {
    return false;
  }
  if (v.length > 32) {
    return false;
  }
  for (const ch of v) {
    if (ch < "a") {
      return false;
    }
    if (ch > "z") {
      return false;
    }
  }
  return true;
}
function isIvLengthWellFormed(v) {
  if (typeof v !== "number") {
    return false;
  }
  if (Number.isFinite(v) === false) {
    return false;
  }
  if (Number.isSafeInteger(v) === false) {
    return false;
  }
  return true;
}
function hasExactEncryptKeys(v) {
  if (isPlainObject(v) === false) {
    return false;
  }
  if (Object.entries(v).length !== 3) {
    return false;
  }
  for (const entry of Object.entries(v)) {
    const k = entry[0];
    if (k !== "algorithm") {
      if (k !== "ivLength") {
        if (k !== "keyUsage") {
          return false;
        }
      }
    }
  }
  return true;
}
function hasExactRequestsKey(v) {
  if (isPlainObject(v) === false) {
    return false;
  }
  if (Object.entries(v).length !== 1) {
    return false;
  }
  for (const entry of Object.entries(v)) {
    const k = entry[0];
    if (k !== "requests") {
      return false;
    }
  }
  return true;
}
export function checkEncryptConfig(value) {
  if (isPlainObject(value) === false) {
    const badIssues = [];
    badIssues.push("bad-algorithm");
    badIssues.push("bad-iv-length");
    badIssues.push("bad-key-usage");
    return {algorithm: null, allowed: false, issues: badIssues, ivLength: null, keyUsage: null, reason: null, valid: false};
  }
  const rawAlg = value.algorithm;
  const rawIv = value.ivLength;
  const rawKey = value.keyUsage;
  const algOk = isAlgorithmWellFormed(rawAlg);
  const ivOk = isIvLengthWellFormed(rawIv);
  const keyOk = isKeyUsageWellFormed(rawKey);
  const issues = [];
  if (algOk === false) {
    issues.push("bad-algorithm");
  }
  if (ivOk === false) {
    issues.push("bad-iv-length");
  }
  if (keyOk === false) {
    issues.push("bad-key-usage");
  }
  const valid = algOk && ivOk && keyOk;
  const matches = rawAlg === "AES-GCM" && rawIv === 12 && rawKey === "encrypt";
  const allowed = valid && matches;
  const reason = allowed ? null : (valid ? "unexpected-config" : null);
  const algEcho = typeof rawAlg === "string" ? rawAlg : null;
  const ivEcho = typeof rawIv === "number" ? rawIv : null;
  const keyEcho = typeof rawKey === "string" ? rawKey : null;
  return {algorithm: algEcho, allowed: allowed, issues: issues, ivLength: ivEcho, keyUsage: keyEcho, reason: reason, valid: valid};
}
export function checkEncryptConfigBatch(batchValue) {
  if (isPlainObject(batchValue) === false) {
    return {results: []};
  }
  const req = batchValue.requests;
  if (Array.isArray(req) === false) {
    return {results: []};
  }
  const results = [];
  for (const item of req) {
    const r = checkEncryptConfig(item);
    results.push(r);
  }
  return {results: results};
}
export function runFeature(payload) {
  if (isPlainObject(payload) === false) {
    const issues = [];
    issues.push("bad-payload");
    const outer = [];
    outer.push(["issues", issues]);
    outer.push(["kind", "unknown"]);
    outer.push(["ok", false]);
    outer.push(["value", null]);
    return Object.fromEntries(outer);
  }
  const kindRaw = payload.kind;
  if (kindRaw !== "check-encrypt-config" && kindRaw !== "check-encrypt-config-batch") {
    const issuesKind = [];
    issuesKind.push("bad-kind");
    const outerKind = [];
    outerKind.push(["issues", issuesKind]);
    outerKind.push(["kind", "unknown"]);
    outerKind.push(["ok", false]);
    outerKind.push(["value", null]);
    return Object.fromEntries(outerKind);
  }
  const val = payload.value;
  if (kindRaw === "check-encrypt-config") {
    if (hasExactEncryptKeys(val) === false) {
      const issuesVal = [];
      issuesVal.push("bad-value");
      const outerVal = [];
      outerVal.push(["issues", issuesVal]);
      outerVal.push(["kind", kindRaw]);
      outerVal.push(["ok", false]);
      outerVal.push(["value", null]);
      return Object.fromEntries(outerVal);
    }
    const inner = checkEncryptConfig(val);
    const outerOk = [];
    outerOk.push(["kind", kindRaw]);
    outerOk.push(["ok", true]);
    outerOk.push(["value", inner]);
    return Object.fromEntries(outerOk);
  }
  if (hasExactRequestsKey(val) === false) {
    const issuesReq = [];
    issuesReq.push("bad-requests");
    const outerReq = [];
    outerReq.push(["issues", issuesReq]);
    outerReq.push(["kind", kindRaw]);
    outerReq.push(["ok", false]);
    outerReq.push(["value", null]);
    return Object.fromEntries(outerReq);
  }
  const reqArr = val.requests;
  if (Array.isArray(reqArr) === false) {
    const issuesArr = [];
    issuesArr.push("bad-requests");
    const outerArr = [];
    outerArr.push(["issues", issuesArr]);
    outerArr.push(["kind", kindRaw]);
    outerArr.push(["ok", false]);
    outerArr.push(["value", null]);
    return Object.fromEntries(outerArr);
  }
  if (reqArr.length > 16) {
    const issuesLen = [];
    issuesLen.push("bad-requests");
    const outerLen = [];
    outerLen.push(["issues", issuesLen]);
    outerLen.push(["kind", kindRaw]);
    outerLen.push(["ok", false]);
    outerLen.push(["value", null]);
    return Object.fromEntries(outerLen);
  }
  for (const item of reqArr) {
    if (hasExactEncryptKeys(item) === false) {
      const issuesItem = [];
      issuesItem.push("bad-requests");
      const outerItem = [];
      outerItem.push(["issues", issuesItem]);
      outerItem.push(["kind", kindRaw]);
      outerItem.push(["ok", false]);
      outerItem.push(["value", null]);
      return Object.fromEntries(outerItem);
    }
  }
  const results = [];
  for (const entry of reqArr) {
    const res = checkEncryptConfig(entry);
    results.push(res);
  }
  const innerBatch = {results: results};
  const outerBatch = [];
  outerBatch.push(["kind", kindRaw]);
  outerBatch.push(["ok", true]);
  outerBatch.push(["value", innerBatch]);
  return Object.fromEntries(outerBatch);
}
