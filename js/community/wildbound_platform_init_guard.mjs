export function checkPlatformInit(value) {
  const isObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
  const initRaw = isObj ? value.initialized : null;
  const crazyRaw = isObj ? value.usingCrazyGames : null;
  const initIsBool = typeof initRaw === "boolean";
  const crazyIsBool = typeof crazyRaw === "boolean";
  const initEcho = initIsBool ? initRaw : null;
  const crazyEcho = crazyIsBool ? crazyRaw : null;
  const issues = [];
  if (initIsBool === false) {
    issues.push("bad-initialized");
  }
  if (crazyIsBool === false) {
    issues.push("bad-using-crazy-games");
  }
  const validFlag = issues.length === 0;
  const allowedFlag = validFlag === false ? false : initEcho === false && crazyEcho === false ? true : initEcho === true && crazyEcho === false ? true : initEcho === true && crazyEcho === true ? true : false;
  const modeValue = validFlag === false ? null : initEcho === false && crazyEcho === false ? "uninitialized" : initEcho === true && crazyEcho === false ? "local-fallback" : initEcho === true && crazyEcho === true ? "crazygames" : null;
  const reasonValue = validFlag === false ? null : initEcho === false && crazyEcho === true ? "inconsistent-flags" : null;
  const pairs = [];
  pairs.push(["allowed", allowedFlag]);
  pairs.push(["initialized", initEcho]);
  pairs.push(["issues", issues]);
  pairs.push(["mode", modeValue]);
  pairs.push(["reason", reasonValue]);
  pairs.push(["usingCrazyGames", crazyEcho]);
  pairs.push(["valid", validFlag]);
  const ordered = Object.fromEntries(pairs);
  return ordered;
}
export function checkPlatformInitBatch(value) {
  const isObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
  const reqList = isObj ? value.requests : null;
  const isArray = Array.isArray(reqList);
  const lenOk = isArray && reqList.length >= 0 && reqList.length <= 16;
  const shapeOk = isObj && isArray && lenOk;
  if (shapeOk === false) {
    const errPairs = [];
    errPairs.push(["results", []]);
    const errValue = Object.fromEntries(errPairs);
    return errValue;
  }
  const results = [];
  for (const candidate of reqList) {
    results.push(checkPlatformInit(candidate));
  }
  const pairs = [];
  pairs.push(["results", results]);
  const ordered = Object.fromEntries(pairs);
  return ordered;
}
export function runFeature(payload) {
  const payloadIsObj = typeof payload === "object" && payload !== null && Array.isArray(payload) === false;
  if (payloadIsObj === false) {
    const badIssues = [];
    badIssues.push("bad-payload");
    return { issues: badIssues, kind: "unknown", ok: false, value: null };
  }
  const payloadKeys = collectKeys(payload);
  const hasKindKey = payloadKeys.includes("kind");
  const hasValueKey = payloadKeys.includes("value");
  const kindIsString = typeof payload.kind === "string";
  if (hasKindKey === false || kindIsString === false) {
    const badIssues = [];
    badIssues.push("bad-kind");
    return { issues: badIssues, kind: "unknown", ok: false, value: null };
  }
  const isSingle = payload.kind === "check-platform-init";
  const isBatch = payload.kind === "check-platform-init-batch";
  if (isSingle === false && isBatch === false) {
    const badIssues = [];
    badIssues.push("bad-kind");
    return { issues: badIssues, kind: "unknown", ok: false, value: null };
  }
  if (hasValueKey === false) {
    if (isSingle) {
      const badIssues = [];
      badIssues.push("bad-value");
      return { issues: badIssues, kind: payload.kind, ok: false, value: null };
    }
    const badIssues = [];
    badIssues.push("bad-requests");
    return { issues: badIssues, kind: payload.kind, ok: false, value: null };
  }
  const rawValue = payload.value;
  const valueIsObj = typeof rawValue === "object" && rawValue !== null && Array.isArray(rawValue) === false;
  if (valueIsObj === false) {
    if (isSingle) {
      const badIssues = [];
      badIssues.push("bad-value");
      return { issues: badIssues, kind: payload.kind, ok: false, value: null };
    }
    const badIssues = [];
    badIssues.push("bad-requests");
    return { issues: badIssues, kind: payload.kind, ok: false, value: null };
  }
  if (isSingle) {
    const valueKeys = collectKeys(rawValue);
    const lenOk = valueKeys.length === 2;
    const hasInit = valueKeys.includes("initialized");
    const hasCrazy = valueKeys.includes("usingCrazyGames");
    const shapeOk = lenOk && hasInit && hasCrazy;
    if (shapeOk === false) {
      const badIssues = [];
      badIssues.push("bad-value");
      return { issues: badIssues, kind: payload.kind, ok: false, value: null };
    }
    const singleResult = checkPlatformInit(rawValue);
    return { kind: payload.kind, ok: true, value: singleResult };
  }
  const batchKeys = collectKeys(rawValue);
  const batchLenOk = batchKeys.length === 1;
  const batchHasReq = batchKeys.includes("requests");
  const batchShapeOk = batchLenOk && batchHasReq;
  if (batchShapeOk === false) {
    const badIssues = [];
    badIssues.push("bad-requests");
    return { issues: badIssues, kind: payload.kind, ok: false, value: null };
  }
  const reqList = rawValue.requests;
  const isArray = Array.isArray(reqList);
  if (isArray === false) {
    const badIssues = [];
    badIssues.push("bad-requests");
    return { issues: badIssues, kind: payload.kind, ok: false, value: null };
  }
  const lenInRange = reqList.length >= 0 && reqList.length <= 16;
  if (lenInRange === false) {
    const badIssues = [];
    badIssues.push("bad-requests");
    return { issues: badIssues, kind: payload.kind, ok: false, value: null };
  }
  const shapeProblems = [];
  for (const candidate of reqList) {
    const candIsObj = typeof candidate === "object" && candidate !== null && Array.isArray(candidate) === false;
    if (candIsObj === false) {
      shapeProblems.push("bad-requests");
    } else {
      const candKeys = collectKeys(candidate);
      const candLenOk = candKeys.length === 2;
      const candHasInit = candKeys.includes("initialized");
      const candHasCrazy = candKeys.includes("usingCrazyGames");
      const candShapeOk = candLenOk && candHasInit && candHasCrazy;
      if (candShapeOk === false) {
        shapeProblems.push("bad-requests");
      }
    }
  }
  if (shapeProblems.length !== 0) {
    const badIssues = [];
    badIssues.push("bad-requests");
    return { issues: badIssues, kind: payload.kind, ok: false, value: null };
  }
  const results = [];
  for (const candidate of reqList) {
    results.push(checkPlatformInit(candidate));
  }
  const resultPairs = [];
  resultPairs.push(["results", results]);
  const batchValue = Object.fromEntries(resultPairs);
  return { kind: payload.kind, ok: true, value: batchValue };
}
function collectKeys(input) {
  const keys = [];
  for (const entry of Object.entries(input)) {
    keys.push(entry[0]);
  }
  return keys;
}
