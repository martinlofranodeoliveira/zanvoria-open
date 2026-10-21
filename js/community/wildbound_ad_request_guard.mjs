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
function isReasonText(input) {
  if (typeof input !== "string") {
    return false;
  }
  if (input.length < 1) {
    return false;
  }
  if (input.length > 32) {
    return false;
  }
  for (const ch of input) {
    const isDash = ch === "-";
    const isUpper = ch >= "A" && ch <= "Z";
    const isLower = ch >= "a" && ch <= "z";
    if (isDash === false && isUpper === false && isLower === false) {
      return false;
    }
  }
  return true;
}
function hasSingleKeys(value) {
  if (isPlainObject(value) === false) {
    return false;
  }
  const entries = Object.entries(value);
  if (entries.length !== 4) {
    return false;
  }
  const found = [];
  for (const entry of entries) {
    const k = entry[0];
    found.push(k);
  }
  if (found.includes("adsEnabled") === false) {
    return false;
  }
  if (found.includes("hasAdApi") === false) {
    return false;
  }
  if (found.includes("reason") === false) {
    return false;
  }
  if (found.includes("usingCrazyGames") === false) {
    return false;
  }
  return true;
}
function hasBatchKeys(value) {
  if (isPlainObject(value) === false) {
    return false;
  }
  const entries = Object.entries(value);
  if (entries.length !== 1) {
    return false;
  }
  const found = [];
  for (const entry of entries) {
    const k = entry[0];
    found.push(k);
  }
  if (found.includes("requests") === false) {
    return false;
  }
  return true;
}
export function checkAdRequest(value) {
  if (isPlainObject(value) === false) {
    return null;
  }
  if (hasSingleKeys(value) === false) {
    return null;
  }
  const adsEcho = typeof value.adsEnabled === "boolean" ? value.adsEnabled : null;
  const apiEcho = typeof value.hasAdApi === "boolean" ? value.hasAdApi : null;
  const sdkEcho = typeof value.usingCrazyGames === "boolean" ? value.usingCrazyGames : null;
  const reasonEcho = typeof value.reason === "string" ? value.reason : null;
  const issues = [];
  if (typeof value.adsEnabled !== "boolean") {
    issues.push("bad-ads-flag");
  }
  if (typeof value.hasAdApi !== "boolean") {
    issues.push("bad-api-flag");
  }
  if (isReasonText(value.reason) === false) {
    issues.push("bad-ad-reason");
  }
  if (typeof value.usingCrazyGames !== "boolean") {
    issues.push("bad-sdk-flag");
  }
  if (issues.length !== 0) {
    const badEntries = [];
    badEntries.push(["adsEnabled", adsEcho]);
    badEntries.push(["blockReason", null]);
    badEntries.push(["hasAdApi", apiEcho]);
    badEntries.push(["issues", issues]);
    badEntries.push(["reason", reasonEcho]);
    badEntries.push(["requested", false]);
    badEntries.push(["usingCrazyGames", sdkEcho]);
    badEntries.push(["valid", false]);
    return Object.fromEntries(badEntries);
  }
  const requested = value.adsEnabled === true && value.hasAdApi === true && value.usingCrazyGames === true;
  const blockReason = requested === true ? null : "ad-not-available";
  const goodEntries = [];
  goodEntries.push(["adsEnabled", adsEcho]);
  goodEntries.push(["blockReason", blockReason]);
  goodEntries.push(["hasAdApi", apiEcho]);
  goodEntries.push(["issues", issues]);
  goodEntries.push(["reason", reasonEcho]);
  goodEntries.push(["requested", requested]);
  goodEntries.push(["usingCrazyGames", sdkEcho]);
  goodEntries.push(["valid", true]);
  return Object.fromEntries(goodEntries);
}
export function checkAdRequestBatch(value) {
  if (isPlainObject(value) === false) {
    return null;
  }
  if (hasBatchKeys(value) === false) {
    return null;
  }
  const requests = value.requests;
  if (Array.isArray(requests) === false) {
    return null;
  }
  if (requests.length > 16) {
    return null;
  }
  const results = [];
  for (const item of requests) {
    const single = checkAdRequest(item);
    if (single === null) {
      return null;
    }
    results.push(single);
  }
  return { results: results };
}
export function runFeature(payload) {
  if (isPlainObject(payload) === false) {
    const earlyIssues = [];
    earlyIssues.push("bad-payload");
    return { issues: earlyIssues, kind: "unknown", ok: false, value: null };
  }
  const kind = payload.kind;
  if (kind !== "check-ad-request" && kind !== "check-ad-request-batch") {
    const kindIssues = [];
    kindIssues.push("bad-kind");
    return { issues: kindIssues, kind: "unknown", ok: false, value: null };
  }
  const payloadEntries = Object.entries(payload);
  const payloadKeys = [];
  for (const entry of payloadEntries) {
    const keyName = entry[0];
    payloadKeys.push(keyName);
  }
  if (payloadKeys.includes("value") === false) {
    if (kind === "check-ad-request") {
      const missingIssues = [];
      missingIssues.push("bad-value");
      const missingEntries = [];
      missingEntries.push(["issues", missingIssues]);
      missingEntries.push(["kind", kind]);
      missingEntries.push(["ok", false]);
      missingEntries.push(["value", null]);
      return Object.fromEntries(missingEntries);
    }
    const missingIssuesB = [];
    missingIssuesB.push("bad-requests");
    const missingEntriesB = [];
    missingEntriesB.push(["issues", missingIssuesB]);
    missingEntriesB.push(["kind", kind]);
    missingEntriesB.push(["ok", false]);
    missingEntriesB.push(["value", null]);
    return Object.fromEntries(missingEntriesB);
  }
  if (kind === "check-ad-request") {
    const singleValue = payload.value;
    const single = checkAdRequest(singleValue);
    if (single === null) {
      const badIssues = [];
      badIssues.push("bad-value");
      const badEntries = [];
      badEntries.push(["issues", badIssues]);
      badEntries.push(["kind", kind]);
      badEntries.push(["ok", false]);
      badEntries.push(["value", null]);
      return Object.fromEntries(badEntries);
    }
    const okEntries = [];
    okEntries.push(["kind", kind]);
    okEntries.push(["ok", true]);
    okEntries.push(["value", single]);
    return Object.fromEntries(okEntries);
  }
  const batchValue = payload.value;
  const batch = checkAdRequestBatch(batchValue);
  if (batch === null) {
    const badIssuesB = [];
    badIssuesB.push("bad-requests");
    const badEntriesB = [];
    badEntriesB.push(["issues", badIssuesB]);
    badEntriesB.push(["kind", kind]);
    badEntriesB.push(["ok", false]);
    badEntriesB.push(["value", null]);
    return Object.fromEntries(badEntriesB);
  }
  const okEntriesB = [];
  okEntriesB.push(["kind", kind]);
  okEntriesB.push(["ok", true]);
  okEntriesB.push(["value", batch]);
  return Object.fromEntries(okEntriesB);
}
