export function checkLocalPlay(value) {
  const isObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
  if (isObj === false) {
    return null;
  }
  const entries = Object.entries(value);
  const keys = [];
  for (const entry of entries) {
    const k = entry[0];
    keys.push(k);
  }
  const hasGameplay = keys.includes("advertisesLocalGameplay");
  const hasScores = keys.includes("advertisesLocalScores");
  const hasNoCloud = keys.includes("advertisesNoCloudLeaderboard");
  const hasNoSdk = keys.includes("advertisesNoSdkDownload");
  const shapeOk = keys.length === 4 && hasGameplay === true && hasScores === true && hasNoCloud === true && hasNoSdk === true;
  if (shapeOk === false) {
    return null;
  }
  const flagGameplay = value.advertisesLocalGameplay;
  const flagScores = value.advertisesLocalScores;
  const flagNoCloud = value.advertisesNoCloudLeaderboard;
  const flagNoSdk = value.advertisesNoSdkDownload;
  const isGameBool = typeof flagGameplay === "boolean";
  const isScoresBool = typeof flagScores === "boolean";
  const isCloudBool = typeof flagNoCloud === "boolean";
  const isSdkBool = typeof flagNoSdk === "boolean";
  const allBool = isGameBool === true && isScoresBool === true && isCloudBool === true && isSdkBool === true;
  if (allBool === true) {
    const complete = flagGameplay === true && flagScores === true && flagNoCloud === true && flagNoSdk === true;
    const issues = [];
    if (flagGameplay === false) {
      issues.push("missing-local-gameplay");
    }
    if (flagScores === false) {
      issues.push("missing-local-scores");
    }
    if (flagNoCloud === false) {
      issues.push("missing-no-cloud-leaderboard");
    }
    if (flagNoSdk === false) {
      issues.push("missing-no-sdk-download");
    }
    const parts = [];
    parts.push(["advertisesLocalGameplay", flagGameplay]);
    parts.push(["advertisesLocalScores", flagScores]);
    parts.push(["advertisesNoCloudLeaderboard", flagNoCloud]);
    parts.push(["advertisesNoSdkDownload", flagNoSdk]);
    parts.push(["complete", complete]);
    parts.push(["issues", issues]);
    parts.push(["valid", true]);
    return Object.fromEntries(parts);
  }
  const echoGameplay = isGameBool === true ? flagGameplay : null;
  const echoScores = isScoresBool === true ? flagScores : null;
  const echoNoCloud = isCloudBool === true ? flagNoCloud : null;
  const echoNoSdk = isSdkBool === true ? flagNoSdk : null;
  const badIssues = [];
  if (isGameBool === false) {
    badIssues.push("bad-local-gameplay");
  }
  if (isScoresBool === false) {
    badIssues.push("bad-local-scores");
  }
  if (isCloudBool === false) {
    badIssues.push("bad-no-cloud-leaderboard");
  }
  if (isSdkBool === false) {
    badIssues.push("bad-no-sdk-download");
  }
  const badParts = [];
  badParts.push(["advertisesLocalGameplay", echoGameplay]);
  badParts.push(["advertisesLocalScores", echoScores]);
  badParts.push(["advertisesNoCloudLeaderboard", echoNoCloud]);
  badParts.push(["advertisesNoSdkDownload", echoNoSdk]);
  badParts.push(["complete", false]);
  badParts.push(["issues", badIssues]);
  badParts.push(["valid", false]);
  return Object.fromEntries(badParts);
}

export function checkLocalPlayBatch(value) {
  const isObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
  if (isObj === false) {
    return null;
  }
  const entries = Object.entries(value);
  const keys = [];
  for (const entry of entries) {
    const k = entry[0];
    keys.push(k);
  }
  const hasRequests = keys.includes("requests");
  const shapeOk = keys.length === 1 && hasRequests === true;
  if (shapeOk === false) {
    return null;
  }
  const reqs = value.requests;
  const isArr = Array.isArray(reqs);
  if (isArr === false) {
    return null;
  }
  const reqLen = reqs.length;
  if (reqLen > 16) {
    return null;
  }
  const results = [];
  for (const req of reqs) {
    const one = checkLocalPlay(req);
    if (one === null) {
      return null;
    }
    results.push(one);
  }
  const parts = [];
  parts.push(["results", results]);
  return Object.fromEntries(parts);
}

export function runFeature(payload) {
  const isPayloadObj = typeof payload === "object" && payload !== null && Array.isArray(payload) === false;
  if (isPayloadObj === false) {
    const issues = [];
    issues.push("bad-payload");
    return { issues: issues, kind: "unknown", ok: false, value: null };
  }
  const payloadEntries = Object.entries(payload);
  const payloadKeys = [];
  for (const entry of payloadEntries) {
    const k = entry[0];
    payloadKeys.push(k);
  }
  const hasKind = payloadKeys.includes("kind");
  const hasValue = payloadKeys.includes("value");
  const payloadShapeOk = payloadKeys.length === 2 && hasKind === true && hasValue === true;
  const rawKind = payload.kind;
  const isSingleKind = rawKind === "check-local-play";
  const isBatchKind = rawKind === "check-local-play-batch";
  const isKnownKind = isSingleKind === true || isBatchKind === true;
  if (payloadShapeOk === false) {
    const echoKind = isKnownKind === true ? rawKind : "unknown";
    const issues = [];
    issues.push("bad-payload");
    return { issues: issues, kind: echoKind, ok: false, value: null };
  }
  if (isKnownKind === false) {
    const issues = [];
    issues.push("bad-kind");
    return { issues: issues, kind: "unknown", ok: false, value: null };
  }
  const inputValue = payload.value;
  if (isSingleKind === true) {
    const single = checkLocalPlay(inputValue);
    if (single === null) {
      const issues = [];
      issues.push("bad-value");
      return { issues: issues, kind: rawKind, ok: false, value: null };
    }
    return { kind: rawKind, ok: true, value: single };
  }
  const batched = checkLocalPlayBatch(inputValue);
  if (batched === null) {
    const isBatchObj = typeof inputValue === "object" && inputValue !== null && Array.isArray(inputValue) === false;
    if (isBatchObj === false) {
      const issues = [];
      issues.push("bad-value");
      return { issues: issues, kind: rawKind, ok: false, value: null };
    }
    const batchEntries = Object.entries(inputValue);
    const batchKeys = [];
    for (const entry of batchEntries) {
      const bk = entry[0];
      batchKeys.push(bk);
    }
    const hasRequests = batchKeys.includes("requests");
    const batchShapeOk = batchKeys.length === 1 && hasRequests === true;
    if (batchShapeOk === false) {
      const issues = [];
      issues.push("bad-value");
      return { issues: issues, kind: rawKind, ok: false, value: null };
    }
    const issues = [];
    issues.push("bad-requests");
    return { issues: issues, kind: rawKind, ok: false, value: null };
  }
  return { kind: rawKind, ok: true, value: batched };
}
