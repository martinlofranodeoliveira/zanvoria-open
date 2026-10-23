export function checkZeroInstall(value) {
  const isObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
  const safeValue = isObj === true ? value : {};
  const creds = isObj === true ? safeValue.advertisesNoCredentials : null;
  const install = isObj === true ? safeValue.advertisesNoPackageInstall : null;
  const credsIsBool = typeof creds === "boolean";
  const installIsBool = typeof install === "boolean";
  const bothBool = credsIsBool === true && installIsBool === true;
  const valid = bothBool;
  const complete = bothBool === true && creds === true && install === true;
  const echoCreds = credsIsBool === true ? creds : null;
  const echoInstall = installIsBool === true ? install : null;
  const issues = [];
  if (bothBool === true) {
    if (creds === false) {
      issues.push("missing-no-credentials");
    }
    if (install === false) {
      issues.push("missing-no-package-install");
    }
  }
  if (bothBool === false) {
    if (credsIsBool === false) {
      issues.push("bad-no-credentials");
    }
    if (installIsBool === false) {
      issues.push("bad-no-package-install");
    }
  }
  const seen = [];
  for (const [key, val] of Object.entries(safeValue)) {
    seen.push(key);
  }
  const resultEntries = [];
  resultEntries.push(["advertisesNoCredentials", echoCreds]);
  resultEntries.push(["advertisesNoPackageInstall", echoInstall]);
  resultEntries.push(["complete", complete]);
  resultEntries.push(["issues", issues]);
  resultEntries.push(["valid", valid]);
  const result = Object.fromEntries(resultEntries);
  return result;
}
export function checkZeroInstallBatch(value) {
  const isObjBatch = typeof value === "object" && value !== null && Array.isArray(value) === false;
  const safeBatch = isObjBatch === true ? value : {};
  const raw = isObjBatch === true ? safeBatch.requests : null;
  const isArr = Array.isArray(raw);
  const reqs = isArr === true ? raw : [];
  const results = [];
  for (const req of reqs) {
    const one = checkZeroInstall(req);
    results.push(one);
  }
  const seenBatch = [];
  for (const [bkey, bval] of Object.entries(safeBatch)) {
    seenBatch.push(bkey);
  }
  return results;
}
export function runFeature(payload) {
  const isPayloadObj = typeof payload === "object" && payload !== null && Array.isArray(payload) === false;
  if (isPayloadObj === false) {
    const issuesPayload = [];
    issuesPayload.push("bad-payload");
    const entriesPayload = [];
    entriesPayload.push(["issues", issuesPayload]);
    entriesPayload.push(["kind", "unknown"]);
    entriesPayload.push(["ok", false]);
    entriesPayload.push(["value", null]);
    const outPayload = Object.fromEntries(entriesPayload);
    return outPayload;
  }
  const kind = payload.kind;
  const isSingle = kind === "check-zero-install";
  const isBatch = kind === "check-zero-install-batch";
  const kindOk = isSingle === true || isBatch === true;
  if (kindOk === false) {
    const issuesKind = [];
    issuesKind.push("bad-kind");
    const entriesKind = [];
    entriesKind.push(["issues", issuesKind]);
    entriesKind.push(["kind", "unknown"]);
    entriesKind.push(["ok", false]);
    entriesKind.push(["value", null]);
    const outKind = Object.fromEntries(entriesKind);
    return outKind;
  }
  const payloadKeys = [];
  for (const [pkey, pval] of Object.entries(payload)) {
    payloadKeys.push(pkey);
  }
  const value = payload.value;
  const hasValue = value !== undefined;
  if (hasValue === false) {
    if (isSingle === true) {
      const issuesNoVal = [];
      issuesNoVal.push("bad-value");
      const entriesNoVal = [];
      entriesNoVal.push(["issues", issuesNoVal]);
      entriesNoVal.push(["kind", kind]);
      entriesNoVal.push(["ok", false]);
      entriesNoVal.push(["value", null]);
      const outNoVal = Object.fromEntries(entriesNoVal);
      return outNoVal;
    }
    const issuesNoReq = [];
    issuesNoReq.push("bad-requests");
    const entriesNoReq = [];
    entriesNoReq.push(["issues", issuesNoReq]);
    entriesNoReq.push(["kind", kind]);
    entriesNoReq.push(["ok", false]);
    entriesNoReq.push(["value", null]);
    const outNoReq = Object.fromEntries(entriesNoReq);
    return outNoReq;
  }
  if (isSingle === true) {
    const isValueObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
    const valueEntries = isValueObj === true ? Object.entries(value) : [];
    const keyList = [];
    for (const [skey, sval] of valueEntries) {
      keyList.push(skey);
    }
    const hasCreds = keyList.includes("advertisesNoCredentials");
    const hasInstall = keyList.includes("advertisesNoPackageInstall");
    const exactSingle = isValueObj === true && keyList.length === 2 && hasCreds === true && hasInstall === true;
    if (exactSingle === false) {
      const issuesBadVal = [];
      issuesBadVal.push("bad-value");
      const entriesBadVal = [];
      entriesBadVal.push(["issues", issuesBadVal]);
      entriesBadVal.push(["kind", kind]);
      entriesBadVal.push(["ok", false]);
      entriesBadVal.push(["value", null]);
      const outBadVal = Object.fromEntries(entriesBadVal);
      return outBadVal;
    }
    const inner = checkZeroInstall(value);
    const topSingle = [];
    topSingle.push(["kind", kind]);
    topSingle.push(["ok", true]);
    topSingle.push(["value", inner]);
    const outSingle = Object.fromEntries(topSingle);
    return outSingle;
  }
  if (isBatch === true) {
    const isBatchObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
    const batchEntries = isBatchObj === true ? Object.entries(value) : [];
    const batchKeys = [];
    for (const [tkey, tval] of batchEntries) {
      batchKeys.push(tkey);
    }
    const hasReqKey = batchKeys.includes("requests");
    const exactBatch = isBatchObj === true && batchKeys.length === 1 && hasReqKey === true;
    if (exactBatch === false) {
      const issuesBadBatch = [];
      issuesBadBatch.push("bad-requests");
      const entriesBadBatch = [];
      entriesBadBatch.push(["issues", issuesBadBatch]);
      entriesBadBatch.push(["kind", kind]);
      entriesBadBatch.push(["ok", false]);
      entriesBadBatch.push(["value", null]);
      const outBadBatch = Object.fromEntries(entriesBadBatch);
      return outBadBatch;
    }
    const requests = value.requests;
    const isArrReq = Array.isArray(requests);
    const reqLen = isArrReq === true ? requests.length : 0;
    const lenOk = isArrReq === true && reqLen >= 0 && reqLen <= 16;
    if (lenOk === false) {
      const issuesLen = [];
      issuesLen.push("bad-requests");
      const entriesLen = [];
      entriesLen.push(["issues", issuesLen]);
      entriesLen.push(["kind", kind]);
      entriesLen.push(["ok", false]);
      entriesLen.push(["value", null]);
      const outLen = Object.fromEntries(entriesLen);
      return outLen;
    }
    for (const reqCheck of requests) {
      const isReqObj = typeof reqCheck === "object" && reqCheck !== null && Array.isArray(reqCheck) === false;
      const reqEntries = isReqObj === true ? Object.entries(reqCheck) : [];
      const reqKeys = [];
      for (const [rkey, rval] of reqEntries) {
        reqKeys.push(rkey);
      }
      const rHasA = reqKeys.includes("advertisesNoCredentials");
      const rHasB = reqKeys.includes("advertisesNoPackageInstall");
      const reqExact = isReqObj === true && reqKeys.length === 2 && rHasA === true && rHasB === true;
      if (reqExact === false) {
        const issuesReq = [];
        issuesReq.push("bad-requests");
        const entriesReq = [];
        entriesReq.push(["issues", issuesReq]);
        entriesReq.push(["kind", kind]);
        entriesReq.push(["ok", false]);
        entriesReq.push(["value", null]);
        const outReq = Object.fromEntries(entriesReq);
        return outReq;
      }
    }
    const results = [];
    for (const reqRun of requests) {
      const evaluated = checkZeroInstall(reqRun);
      results.push(evaluated);
    }
    const innerBatchEntries = [];
    innerBatchEntries.push(["results", results]);
    const innerBatch = Object.fromEntries(innerBatchEntries);
    const topBatch = [];
    topBatch.push(["kind", kind]);
    topBatch.push(["ok", true]);
    topBatch.push(["value", innerBatch]);
    const outBatch = Object.fromEntries(topBatch);
    return outBatch;
  }
  const issuesFall = [];
  issuesFall.push("bad-kind");
  const entriesFall = [];
  entriesFall.push(["issues", issuesFall]);
  entriesFall.push(["kind", "unknown"]);
  entriesFall.push(["ok", false]);
  entriesFall.push(["value", null]);
  const outFall = Object.fromEntries(entriesFall);
  return outFall;
}
