export function checkHonestScope(value) {
  const isObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
  const found = [];
  if (isObj) {
    for (const entry of Object.entries(value)) {
      found.push(entry[0]);
    }
  }
  const hasThree = found.length === 3;
  const hasCloudKey = found.includes("cloudLeaderboard");
  const hasDeployKey = found.includes("productionDeploy");
  const hasSdkKey = found.includes("sdkDownload");
  const hasExact = isObj && hasThree && hasCloudKey && hasDeployKey && hasSdkKey;
  const cloudRaw = isObj ? value.cloudLeaderboard : null;
  const deployRaw = isObj ? value.productionDeploy : null;
  const sdkRaw = isObj ? value.sdkDownload : null;
  const cloudIsBool = typeof cloudRaw === "boolean";
  const deployIsBool = typeof deployRaw === "boolean";
  const sdkIsBool = typeof sdkRaw === "boolean";
  const cloudEcho = cloudIsBool ? cloudRaw : null;
  const deployEcho = deployIsBool ? deployRaw : null;
  const sdkEcho = sdkIsBool ? sdkRaw : null;
  const issues = [];
  if (cloudIsBool === false) {
    issues.push("bad-cloud-flag");
  }
  if (deployIsBool === false) {
    issues.push("bad-deploy-flag");
  }
  if (sdkIsBool === false) {
    issues.push("bad-sdk-flag");
  }
  const valid = hasExact && cloudIsBool && deployIsBool && sdkIsBool;
  const allFalse = cloudRaw === false && deployRaw === false && sdkRaw === false;
  const honest = valid ? (allFalse ? true : false) : null;
  const reason = valid ? (allFalse ? null : "dishonest-claim") : null;
  const literal = { cloudLeaderboard: cloudEcho, honest: honest, issues: issues, productionDeploy: deployEcho, reason: reason, sdkDownload: sdkEcho, valid: valid };
  return Object.fromEntries(Object.entries(literal));
}
export function checkHonestScopeBatch(input) {
  const isObj = typeof input === "object" && input !== null && Array.isArray(input) === false;
  const maybeReq = isObj ? input.requests : input;
  const reqs = Array.isArray(maybeReq) ? maybeReq : [];
  const results = [];
  if (Array.isArray(reqs)) {
    for (const entry of Object.entries(reqs)) {
      results.push(checkHonestScope(entry[1]));
    }
  }
  return results;
}
export function runFeature(payload) {
  const isPayloadObj = typeof payload === "object" && payload !== null && Array.isArray(payload) === false;
  if (isPayloadObj === false) {
    const badPayloadIssues = [];
    badPayloadIssues.push("bad-payload");
    const badPayloadObj = { issues: badPayloadIssues, kind: "unknown", ok: false, value: null };
    return Object.fromEntries(Object.entries(badPayloadObj));
  }
  const payloadKeys = [];
  for (const entry of Object.entries(payload)) {
    payloadKeys.push(entry[0]);
  }
  const kindRaw = payload.kind;
  const valueRaw = payload.value;
  const hasKindKey = payloadKeys.includes("kind");
  const hasValueKey = payloadKeys.includes("value");
  const isSingle = kindRaw === "check-honest-scope";
  const isBatch = kindRaw === "check-honest-scope-batch";
  if (hasKindKey === false) {
    const badKindIssues = [];
    badKindIssues.push("bad-kind");
    const badKindObj = { issues: badKindIssues, kind: "unknown", ok: false, value: null };
    return Object.fromEntries(Object.entries(badKindObj));
  }
  if (isSingle === false && isBatch === false) {
    const badKind2Issues = [];
    badKind2Issues.push("bad-kind");
    const badKind2Obj = { issues: badKind2Issues, kind: "unknown", ok: false, value: null };
    return Object.fromEntries(Object.entries(badKind2Obj));
  }
  if (hasValueKey === false) {
    if (isSingle) {
      const noValueIssues = [];
      noValueIssues.push("bad-value");
      const noValueObj = { issues: noValueIssues, kind: kindRaw, ok: false, value: null };
      return Object.fromEntries(Object.entries(noValueObj));
    }
    const noReqIssues = [];
    noReqIssues.push("bad-requests");
    const noReqObj = { issues: noReqIssues, kind: kindRaw, ok: false, value: null };
    return Object.fromEntries(Object.entries(noReqObj));
  }
  if (isSingle) {
    const isValObj = typeof valueRaw === "object" && valueRaw !== null && Array.isArray(valueRaw) === false;
    if (isValObj === false) {
      const badValueIssues = [];
      badValueIssues.push("bad-value");
      const badValueObj = { issues: badValueIssues, kind: kindRaw, ok: false, value: null };
      return Object.fromEntries(Object.entries(badValueObj));
    }
    const valKeys = [];
    for (const entry of Object.entries(valueRaw)) {
      valKeys.push(entry[0]);
    }
    const hasThree = valKeys.length === 3;
    const hasCloud = valKeys.includes("cloudLeaderboard");
    const hasDeploy = valKeys.includes("productionDeploy");
    const hasSdk = valKeys.includes("sdkDownload");
    const hasExact = hasThree && hasCloud && hasDeploy && hasSdk;
    if (hasExact === false) {
      const badValue2Issues = [];
      badValue2Issues.push("bad-value");
      const badValue2Obj = { issues: badValue2Issues, kind: kindRaw, ok: false, value: null };
      return Object.fromEntries(Object.entries(badValue2Obj));
    }
    const singleResult = checkHonestScope(valueRaw);
    const singleOk = { kind: kindRaw, ok: true, value: singleResult };
    return Object.fromEntries(Object.entries(singleOk));
  }
  const isBValObj = typeof valueRaw === "object" && valueRaw !== null && Array.isArray(valueRaw) === false;
  if (isBValObj === false) {
    const badReqIssues = [];
    badReqIssues.push("bad-requests");
    const badReqObj = { issues: badReqIssues, kind: kindRaw, ok: false, value: null };
    return Object.fromEntries(Object.entries(badReqObj));
  }
  const bKeys = [];
  for (const entry of Object.entries(valueRaw)) {
    bKeys.push(entry[0]);
  }
  const bHasOne = bKeys.length === 1;
  const bHasReqKey = bKeys.includes("requests");
  const bExact = bHasOne && bHasReqKey;
  if (bExact === false) {
    const badReq2Issues = [];
    badReq2Issues.push("bad-requests");
    const badReq2Obj = { issues: badReq2Issues, kind: kindRaw, ok: false, value: null };
    return Object.fromEntries(Object.entries(badReq2Obj));
  }
  const reqRaw = valueRaw.requests;
  const isReqArr = Array.isArray(reqRaw);
  if (isReqArr === false) {
    const badReq3Issues = [];
    badReq3Issues.push("bad-requests");
    const badReq3Obj = { issues: badReq3Issues, kind: kindRaw, ok: false, value: null };
    return Object.fromEntries(Object.entries(badReq3Obj));
  }
  const reqLen = reqRaw.length;
  const lenOk = reqLen >= 0 && reqLen <= 16;
  if (lenOk === false) {
    const badReq4Issues = [];
    badReq4Issues.push("bad-requests");
    const badReq4Obj = { issues: badReq4Issues, kind: kindRaw, ok: false, value: null };
    return Object.fromEntries(Object.entries(badReq4Obj));
  }
  const elemValid = [];
  const results = [];
  for (const entry of Object.entries(reqRaw)) {
    const req = entry[1];
    const isRObj = typeof req === "object" && req !== null && Array.isArray(req) === false;
    if (isRObj) {
      const rKeys = [];
      for (const inner of Object.entries(req)) {
        rKeys.push(inner[0]);
      }
      const rHasThree = rKeys.length === 3;
      const rHasCloud = rKeys.includes("cloudLeaderboard");
      const rHasDeploy = rKeys.includes("productionDeploy");
      const rHasSdk = rKeys.includes("sdkDownload");
      const rExact = rHasThree && rHasCloud && rHasDeploy && rHasSdk;
      if (rExact) {
        elemValid.push(true);
      } else {
        elemValid.push(false);
      }
      results.push(checkHonestScope(req));
    } else {
      elemValid.push(false);
      results.push(checkHonestScope(req));
    }
  }
  const hasInvalid = elemValid.includes(false);
  if (hasInvalid) {
    const badReq5Issues = [];
    badReq5Issues.push("bad-requests");
    const badReq5Obj = { issues: badReq5Issues, kind: kindRaw, ok: false, value: null };
    return Object.fromEntries(Object.entries(badReq5Obj));
  }
  const batchValue = { results: results };
  const batchValueSorted = Object.fromEntries(Object.entries(batchValue));
  const batchOk = { kind: kindRaw, ok: true, value: batchValueSorted };
  return Object.fromEntries(Object.entries(batchOk));
}
