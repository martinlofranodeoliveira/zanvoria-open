export function checkLeaderboardSubmit(value) {
  if (hasSingleExactKeys(value) === false) {
    return null;
  }
  const hasKeyRaw = value.hasKey;
  const hasSubmitApiRaw = value.hasSubmitApi;
  const usingCrazyGamesRaw = value.usingCrazyGames;
  const hasKeyIsBool = typeof hasKeyRaw === "boolean";
  const hasApiIsBool = typeof hasSubmitApiRaw === "boolean";
  const hasSdkIsBool = typeof usingCrazyGamesRaw === "boolean";
  if (hasKeyIsBool === true) {
    if (hasApiIsBool === true) {
      if (hasSdkIsBool === true) {
        if (hasKeyRaw === true) {
          if (hasSubmitApiRaw === true) {
            if (usingCrazyGamesRaw === true) {
              const issuesA = [];
              const orderedA = buildSingleOrdered(hasKeyRaw, hasSubmitApiRaw, issuesA, null, true, usingCrazyGamesRaw, true);
              return orderedA;
            }
          }
        }
        const issuesB = [];
        const orderedB = buildSingleOrdered(hasKeyRaw, hasSubmitApiRaw, issuesB, "leaderboard-not-configured", false, usingCrazyGamesRaw, true);
        return orderedB;
      }
    }
  }
  const issues = [];
  if (hasKeyIsBool === false) {
    issues.push("bad-key-flag");
  }
  if (hasApiIsBool === false) {
    issues.push("bad-api-flag");
  }
  if (hasSdkIsBool === false) {
    issues.push("bad-sdk-flag");
  }
  const hasKeyEcho = hasKeyIsBool === true ? hasKeyRaw : null;
  const hasApiEcho = hasApiIsBool === true ? hasSubmitApiRaw : null;
  const hasSdkEcho = hasSdkIsBool === true ? usingCrazyGamesRaw : null;
  const orderedBad = buildSingleOrdered(hasKeyEcho, hasApiEcho, issues, null, false, hasSdkEcho, false);
  return orderedBad;
}
export function checkLeaderboardSubmitBatch(value) {
  if (hasBatchExactKeys(value) === false) {
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
  for (const req of requests) {
    const one = checkLeaderboardSubmit(req);
    if (one === null) {
      return null;
    }
    results.push(one);
  }
  const pairs = [];
  pairs.push(["results", results]);
  const ordered = Object.fromEntries(pairs);
  return ordered;
}
export function runFeature(payload) {
  if (isPlainObject(payload) === false) {
    const issuesA = [];
    issuesA.push("bad-payload");
    const outA = { issues: issuesA, kind: "unknown", ok: false, value: null };
    return outA;
  }
  if (hasPayloadExactKeys(payload) === false) {
    const kindRawX = payload.kind;
    if (isSingleKindText(kindRawX) === true) {
      const issuesX = [];
      issuesX.push("bad-payload");
      const outX = { issues: issuesX, kind: kindRawX, ok: false, value: null };
      return outX;
    }
    if (isBatchKindText(kindRawX) === true) {
      const issuesY = [];
      issuesY.push("bad-payload");
      const outY = { issues: issuesY, kind: kindRawX, ok: false, value: null };
      return outY;
    }
    const issuesZ = [];
    issuesZ.push("bad-kind");
    const outZ = { issues: issuesZ, kind: "unknown", ok: false, value: null };
    return outZ;
  }
  const kind = payload.kind;
  const value = payload.value;
  if (isSingleKindText(kind) === true) {
    if (hasSingleExactKeys(value) === false) {
      const issuesS = [];
      issuesS.push("bad-value");
      const outS = { issues: issuesS, kind: kind, ok: false, value: null };
      return outS;
    }
    const inner = checkLeaderboardSubmit(value);
    if (inner === null) {
      const issuesS2 = [];
      issuesS2.push("bad-value");
      const outS2 = { issues: issuesS2, kind: kind, ok: false, value: null };
      return outS2;
    }
    const outOk = { kind: kind, ok: true, value: inner };
    return outOk;
  }
  if (isBatchKindText(kind) === true) {
    if (hasBatchExactKeys(value) === false) {
      const issuesB = [];
      issuesB.push("bad-value");
      const outB = { issues: issuesB, kind: kind, ok: false, value: null };
      return outB;
    }
    const requests = value.requests;
    if (Array.isArray(requests) === false) {
      const issuesB2 = [];
      issuesB2.push("bad-requests");
      const outB2 = { issues: issuesB2, kind: kind, ok: false, value: null };
      return outB2;
    }
    if (requests.length > 16) {
      const issuesB3 = [];
      issuesB3.push("bad-requests");
      const outB3 = { issues: issuesB3, kind: kind, ok: false, value: null };
      return outB3;
    }
    const results = [];
    for (const req of requests) {
      const one = checkLeaderboardSubmit(req);
      if (one === null) {
        const issuesB4 = [];
        issuesB4.push("bad-requests");
        const outB4 = { issues: issuesB4, kind: kind, ok: false, value: null };
        return outB4;
      }
      results.push(one);
    }
    const pairs = [];
    pairs.push(["results", results]);
    const innerBatch = Object.fromEntries(pairs);
    const outBatch = { kind: kind, ok: true, value: innerBatch };
    return outBatch;
  }
  const issuesK = [];
  issuesK.push("bad-kind");
  const outK = { issues: issuesK, kind: "unknown", ok: false, value: null };
  return outK;
}
function isPlainObject(value) {
  if (typeof value !== "object") {
    return false;
  }
  if (value === null) {
    return false;
  }
  if (Array.isArray(value) === true) {
    return false;
  }
  return true;
}
function isSingleKindText(text) {
  const expected = "check-leaderboard-submit";
  if (typeof text !== "string") {
    return false;
  }
  if (typeof expected !== "string") {
    return false;
  }
  const seen = [];
  for (const ch of text) {
    seen.push(ch);
  }
  const wanted = [];
  for (const ch of expected) {
    wanted.push(ch);
  }
  if (seen.length !== wanted.length) {
    return false;
  }
  if (text === expected) {
    return true;
  }
  return false;
}
function isBatchKindText(text) {
  const expected = "check-leaderboard-submit-batch";
  if (typeof text !== "string") {
    return false;
  }
  if (typeof expected !== "string") {
    return false;
  }
  const seen = [];
  for (const ch of text) {
    seen.push(ch);
  }
  const wanted = [];
  for (const ch of expected) {
    wanted.push(ch);
  }
  if (seen.length !== wanted.length) {
    return false;
  }
  if (text === expected) {
    return true;
  }
  return false;
}
function hasSingleExactKeys(value) {
  if (isPlainObject(value) === false) {
    return false;
  }
  const keys = [];
  for (const entry of Object.entries(value)) {
    const k = entry[0];
    keys.push(k);
  }
  if (keys.length !== 3) {
    return false;
  }
  const found = [];
  for (const entry of Object.entries(value)) {
    const k = entry[0];
    if (k === "hasKey") {
      found.push(k);
    }
    if (k === "hasSubmitApi") {
      found.push(k);
    }
    if (k === "usingCrazyGames") {
      found.push(k);
    }
  }
  if (found.length !== 3) {
    return false;
  }
  return true;
}
function hasBatchExactKeys(value) {
  if (isPlainObject(value) === false) {
    return false;
  }
  const keys = [];
  for (const entry of Object.entries(value)) {
    const k = entry[0];
    keys.push(k);
  }
  if (keys.length !== 1) {
    return false;
  }
  for (const entry of Object.entries(value)) {
    const k = entry[0];
    if (k === "requests") {
      return true;
    }
  }
  return false;
}
function hasPayloadExactKeys(value) {
  if (isPlainObject(value) === false) {
    return false;
  }
  const keys = [];
  for (const entry of Object.entries(value)) {
    const k = entry[0];
    keys.push(k);
  }
  if (keys.length !== 2) {
    return false;
  }
  const found = [];
  for (const entry of Object.entries(value)) {
    const k = entry[0];
    if (k === "kind") {
      found.push(k);
    }
    if (k === "value") {
      found.push(k);
    }
  }
  if (found.length !== 2) {
    return false;
  }
  return true;
}
function buildSingleOrdered(hasKeyEcho, hasSubmitApiEcho, issues, reason, submitted, usingCrazyGamesEcho, valid) {
  const pairs = [];
  pairs.push(["hasKey", hasKeyEcho]);
  pairs.push(["hasSubmitApi", hasSubmitApiEcho]);
  pairs.push(["issues", issues]);
  pairs.push(["reason", reason]);
  pairs.push(["submitted", submitted]);
  pairs.push(["usingCrazyGames", usingCrazyGamesEcho]);
  pairs.push(["valid", valid]);
  const ordered = Object.fromEntries(pairs);
  return ordered;
}
