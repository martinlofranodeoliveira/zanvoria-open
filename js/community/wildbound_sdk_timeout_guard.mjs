export function checkSdkTimeout(value) {
  const isObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
  if (isObj === false) {
    const badPairsA = [];
    badPairsA.push(["allowed", false]);
    badPairsA.push(["expected", 1400]);
    badPairsA.push(["issues", ["bad-timeout"]]);
    badPairsA.push(["matched", false]);
    badPairsA.push(["reason", null]);
    badPairsA.push(["timeoutMs", null]);
    badPairsA.push(["valid", false]);
    const badOrderedA = Object.fromEntries(badPairsA);
    return badOrderedA;
  }
  const countOkA = Object.entries(value).length === 1;
  if (countOkA === false) {
    const rawA = value.timeoutMs;
    const echoA = typeof rawA === "number" ? rawA : null;
    const badPairsB = [];
    badPairsB.push(["allowed", false]);
    badPairsB.push(["expected", 1400]);
    badPairsB.push(["issues", ["bad-timeout"]]);
    badPairsB.push(["matched", false]);
    badPairsB.push(["reason", null]);
    badPairsB.push(["timeoutMs", echoA]);
    badPairsB.push(["valid", false]);
    const badOrderedB = Object.fromEntries(badPairsB);
    return badOrderedB;
  }
  for (const entry of Object.entries(value)) {
    const keyOk = entry[0] === "timeoutMs";
    if (keyOk === false) {
      const rawB = value.timeoutMs;
      const echoB = typeof rawB === "number" ? rawB : null;
      const badPairsC = [];
      badPairsC.push(["allowed", false]);
      badPairsC.push(["expected", 1400]);
      badPairsC.push(["issues", ["bad-timeout"]]);
      badPairsC.push(["matched", false]);
      badPairsC.push(["reason", null]);
      badPairsC.push(["timeoutMs", echoB]);
      badPairsC.push(["valid", false]);
      const badOrderedC = Object.fromEntries(badPairsC);
      return badOrderedC;
    }
  }
  const raw = value.timeoutMs;
  const isSafe = Number.isSafeInteger(raw);
  if (isSafe === false) {
    const echo = typeof raw === "number" ? raw : null;
    const badPairs = [];
    badPairs.push(["allowed", false]);
    badPairs.push(["expected", 1400]);
    badPairs.push(["issues", ["bad-timeout"]]);
    badPairs.push(["matched", false]);
    badPairs.push(["reason", null]);
    badPairs.push(["timeoutMs", echo]);
    badPairs.push(["valid", false]);
    const badOrdered = Object.fromEntries(badPairs);
    return badOrdered;
  }
  const matched = raw === 1400;
  const allowed = matched === true ? true : false;
  const reason = matched === true ? null : "nonstandard-timeout";
  const pairs = [];
  pairs.push(["allowed", allowed]);
  pairs.push(["expected", 1400]);
  pairs.push(["issues", []]);
  pairs.push(["matched", matched]);
  pairs.push(["reason", reason]);
  pairs.push(["timeoutMs", raw]);
  pairs.push(["valid", true]);
  const ordered = Object.fromEntries(pairs);
  return ordered;
}
export function checkSdkTimeoutBatch(value) {
  const isObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
  if (isObj === false) {
    const emptyA = [];
    return emptyA;
  }
  for (const entry of Object.entries(value)) {
    const keyOk = entry[0] === "requests";
    if (keyOk === false) {
      const emptyB = [];
      return emptyB;
    }
  }
  const countOk = Object.entries(value).length === 1;
  if (countOk === false) {
    const emptyC = [];
    return emptyC;
  }
  const requests = value.requests;
  const isArr = Array.isArray(requests);
  if (isArr === false) {
    const emptyD = [];
    return emptyD;
  }
  const results = [];
  for (const req of requests) {
    const one = checkSdkTimeout(req);
    results.push(one);
  }
  return results;
}
export function runFeature(payload) {
  const isPayloadObj = typeof payload === "object" && payload !== null && Array.isArray(payload) === false;
  if (isPayloadObj === false) {
    return {issues: ["bad-payload"], kind: "unknown", ok: false, value: null};
  }
  const kind = payload.kind;
  const isSingle = kind === "check-sdk-timeout";
  const isBatch = kind === "check-sdk-timeout-batch";
  if (isSingle === false && isBatch === false) {
    return {issues: ["bad-kind"], kind: "unknown", ok: false, value: null};
  }
  const value = payload.value;
  if (isSingle === true) {
    const isValueObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
    if (isValueObj === false) {
      return {issues: ["bad-value"], kind: kind, ok: false, value: null};
    }
    const countOk = Object.entries(value).length === 1;
    if (countOk === false) {
      return {issues: ["bad-value"], kind: kind, ok: false, value: null};
    }
    for (const entry of Object.entries(value)) {
      const keyOk = entry[0] === "timeoutMs";
      if (keyOk === false) {
        return {issues: ["bad-value"], kind: kind, ok: false, value: null};
      }
    }
    const inner = checkSdkTimeout(value);
    return {kind: kind, ok: true, value: inner};
  }
  const isBatchValueObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
  if (isBatchValueObj === false) {
    return {issues: ["bad-requests"], kind: kind, ok: false, value: null};
  }
  const batchCountOk = Object.entries(value).length === 1;
  if (batchCountOk === false) {
    return {issues: ["bad-requests"], kind: kind, ok: false, value: null};
  }
  for (const entry of Object.entries(value)) {
    const batchKeyOk = entry[0] === "requests";
    if (batchKeyOk === false) {
      return {issues: ["bad-requests"], kind: kind, ok: false, value: null};
    }
  }
  const requests = value.requests;
  const isArr = Array.isArray(requests);
  if (isArr === false) {
    return {issues: ["bad-requests"], kind: kind, ok: false, value: null};
  }
  const len = requests.length;
  const lenOk = len >= 0 && len <= 16;
  if (lenOk === false) {
    return {issues: ["bad-requests"], kind: kind, ok: false, value: null};
  }
  const results = [];
  for (const req of requests) {
    const one = checkSdkTimeout(req);
    results.push(one);
  }
  const batchValue = {results: results};
  return {kind: kind, ok: true, value: batchValue};
}
