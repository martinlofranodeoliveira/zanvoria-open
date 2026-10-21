function isAssetKindText(text) {
  if (typeof text !== "string") {
    return false;
  }
  if (text.length < 1) {
    return false;
  }
  if (text.length > 48) {
    return false;
  }
  for (const ch of text) {
    if (ch === "-") {
      continue;
    }
    if (ch >= "a") {
      if (ch <= "z") {
        continue;
      }
    }
    return false;
  }
  return true;
}
function isAssetWrapper(candidate) {
  if (typeof candidate !== "object") {
    return false;
  }
  if (candidate === null) {
    return false;
  }
  if (Array.isArray(candidate) === true) {
    return false;
  }
  const seen = [];
  for (const entry of Object.entries(candidate)) {
    const k = entry[0];
    seen.push(k);
  }
  if (seen.length !== 1) {
    return false;
  }
  const first = seen[0];
  if (first !== "assetKind") {
    return false;
  }
  return true;
}
function isBatchWrapper(candidate) {
  if (typeof candidate !== "object") {
    return false;
  }
  if (candidate === null) {
    return false;
  }
  if (Array.isArray(candidate) === true) {
    return false;
  }
  const seen = [];
  for (const entry of Object.entries(candidate)) {
    const k = entry[0];
    seen.push(k);
  }
  if (seen.length !== 1) {
    return false;
  }
  const first = seen[0];
  if (first !== "requests") {
    return false;
  }
  return true;
}
export function checkAssetFallback(value) {
  if (typeof value !== "object") {
    return { allowed: false, assetKind: null, issues: ["bad-asset-kind"], reason: null, valid: false };
  }
  if (value === null) {
    return { allowed: false, assetKind: null, issues: ["bad-asset-kind"], reason: null, valid: false };
  }
  if (Array.isArray(value) === true) {
    return { allowed: false, assetKind: null, issues: ["bad-asset-kind"], reason: null, valid: false };
  }
  const keys = [];
  for (const entry of Object.entries(value)) {
    const k = entry[0];
    keys.push(k);
  }
  if (keys.length !== 1) {
    const raw = value.assetKind;
    if (typeof raw === "string") {
      return { allowed: false, assetKind: raw, issues: ["bad-asset-kind"], reason: null, valid: false };
    }
    return { allowed: false, assetKind: null, issues: ["bad-asset-kind"], reason: null, valid: false };
  }
  const first = keys[0];
  if (first !== "assetKind") {
    const raw2 = value.assetKind;
    if (typeof raw2 === "string") {
      return { allowed: false, assetKind: raw2, issues: ["bad-asset-kind"], reason: null, valid: false };
    }
    return { allowed: false, assetKind: null, issues: ["bad-asset-kind"], reason: null, valid: false };
  }
  const kindText = value.assetKind;
  if (isAssetKindText(kindText) === false) {
    if (typeof kindText === "string") {
      return { allowed: false, assetKind: kindText, issues: ["bad-asset-kind"], reason: null, valid: false };
    }
    return { allowed: false, assetKind: null, issues: ["bad-asset-kind"], reason: null, valid: false };
  }
  if (kindText === "procedural-canvas") {
    const pairs = [];
    pairs.push(["allowed", true]);
    pairs.push(["assetKind", kindText]);
    pairs.push(["issues", []]);
    pairs.push(["reason", null]);
    pairs.push(["valid", true]);
    return Object.fromEntries(pairs);
  }
  if (kindText === "browser-sound") {
    const pairs2 = [];
    pairs2.push(["allowed", true]);
    pairs2.push(["assetKind", kindText]);
    pairs2.push(["issues", []]);
    pairs2.push(["reason", null]);
    pairs2.push(["valid", true]);
    return Object.fromEntries(pairs2);
  }
  return { allowed: false, assetKind: kindText, issues: [], reason: "excluded-asset", valid: true };
}
export function checkAssetFallbackBatch(batchValue) {
  if (typeof batchValue !== "object") {
    return { results: [] };
  }
  if (batchValue === null) {
    return { results: [] };
  }
  if (Array.isArray(batchValue) === true) {
    return { results: [] };
  }
  const keys = [];
  for (const entry of Object.entries(batchValue)) {
    const k = entry[0];
    keys.push(k);
  }
  if (keys.length !== 1) {
    return { results: [] };
  }
  const first = keys[0];
  if (first !== "requests") {
    return { results: [] };
  }
  const requests = batchValue.requests;
  if (Array.isArray(requests) === false) {
    return { results: [] };
  }
  if (requests.length > 16) {
    return { results: [] };
  }
  const results = [];
  for (const item of requests) {
    const single = checkAssetFallback(item);
    results.push(single);
  }
  const pairs = [];
  pairs.push(["results", results]);
  return Object.fromEntries(pairs);
}
export function runFeature(payload) {
  if (typeof payload !== "object") {
    return { issues: ["bad-payload"], kind: "unknown", ok: false, value: null };
  }
  if (payload === null) {
    return { issues: ["bad-payload"], kind: "unknown", ok: false, value: null };
  }
  if (Array.isArray(payload) === true) {
    return { issues: ["bad-payload"], kind: "unknown", ok: false, value: null };
  }
  const kindHits = [];
  const valueHits = [];
  for (const entry of Object.entries(payload)) {
    const k = entry[0];
    if (k === "kind") {
      kindHits.push(k);
    }
    if (k === "value") {
      valueHits.push(k);
    }
  }
  if (kindHits.length !== 1) {
    return { issues: ["bad-kind"], kind: "unknown", ok: false, value: null };
  }
  const kindValue = payload.kind;
  if (kindValue !== "check-asset-fallback") {
    if (kindValue !== "check-asset-fallback-batch") {
      return { issues: ["bad-kind"], kind: "unknown", ok: false, value: null };
    }
  }
  if (valueHits.length !== 1) {
    if (kindValue === "check-asset-fallback") {
      const ePairs = [];
      ePairs.push(["issues", ["bad-value"]]);
      ePairs.push(["kind", kindValue]);
      ePairs.push(["ok", false]);
      ePairs.push(["value", null]);
      return Object.fromEntries(ePairs);
    }
    const ePairs2 = [];
    ePairs2.push(["issues", ["bad-requests"]]);
    ePairs2.push(["kind", kindValue]);
    ePairs2.push(["ok", false]);
    ePairs2.push(["value", null]);
    return Object.fromEntries(ePairs2);
  }
  const inner = payload.value;
  if (kindValue === "check-asset-fallback") {
    if (isAssetWrapper(inner) === false) {
      const ePairs3 = [];
      ePairs3.push(["issues", ["bad-value"]]);
      ePairs3.push(["kind", kindValue]);
      ePairs3.push(["ok", false]);
      ePairs3.push(["value", null]);
      return Object.fromEntries(ePairs3);
    }
    const single = checkAssetFallback(inner);
    const sPairs = [];
    sPairs.push(["kind", kindValue]);
    sPairs.push(["ok", true]);
    sPairs.push(["value", single]);
    return Object.fromEntries(sPairs);
  }
  if (isBatchWrapper(inner) === false) {
    const ePairs4 = [];
    ePairs4.push(["issues", ["bad-requests"]]);
    ePairs4.push(["kind", kindValue]);
    ePairs4.push(["ok", false]);
    ePairs4.push(["value", null]);
    return Object.fromEntries(ePairs4);
  }
  const reqs = inner.requests;
  if (Array.isArray(reqs) === false) {
    const ePairs5 = [];
    ePairs5.push(["issues", ["bad-requests"]]);
    ePairs5.push(["kind", kindValue]);
    ePairs5.push(["ok", false]);
    ePairs5.push(["value", null]);
    return Object.fromEntries(ePairs5);
  }
  if (reqs.length > 16) {
    const ePairs6 = [];
    ePairs6.push(["issues", ["bad-requests"]]);
    ePairs6.push(["kind", kindValue]);
    ePairs6.push(["ok", false]);
    ePairs6.push(["value", null]);
    return Object.fromEntries(ePairs6);
  }
  const badList = [];
  for (const item of reqs) {
    if (isAssetWrapper(item) === false) {
      badList.push(item);
    }
  }
  if (badList.length !== 0) {
    const ePairs7 = [];
    ePairs7.push(["issues", ["bad-requests"]]);
    ePairs7.push(["kind", kindValue]);
    ePairs7.push(["ok", false]);
    ePairs7.push(["value", null]);
    return Object.fromEntries(ePairs7);
  }
  const results = [];
  for (const item2 of reqs) {
    const r = checkAssetFallback(item2);
    results.push(r);
  }
  const innerPairs = [];
  innerPairs.push(["results", results]);
  const innerValue = Object.fromEntries(innerPairs);
  const bPairs = [];
  bPairs.push(["kind", kindValue]);
  bPairs.push(["ok", true]);
  bPairs.push(["value", innerValue]);
  return Object.fromEntries(bPairs);
}
