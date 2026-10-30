function isMethodCharsOk(m) {
  const bad = [];
  for (const ch of m) {
    if ((ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z")) {
    } else {
      bad.push(ch);
    }
  }
  if (bad.length === 0) {
    return true;
  }
  return false;
}
function isAllowlisted(m) {
  const allow = ["init", "loadingStart", "loadingStop", "gameplayStart", "gameplayStop", "getSave", "setSave", "getSettings", "setSettings", "requestAd", "onMuteChange", "submitScore", "isCrazyGames"];
  const hits = [];
  for (const candidate of allow) {
    if (candidate === m) {
      hits.push(candidate);
    }
  }
  if (hits.length === 0) {
    return false;
  }
  return true;
}
function needsInit(m) {
  const gated = ["loadingStart", "loadingStop", "gameplayStart", "gameplayStop", "getSave", "setSave", "requestAd", "onMuteChange", "submitScore"];
  const hits = [];
  for (const candidate of gated) {
    if (candidate === m) {
      hits.push(candidate);
    }
  }
  if (hits.length === 0) {
    return false;
  }
  return true;
}
function isLocalOnly(m) {
  const local = ["getSettings", "setSettings"];
  const hits = [];
  for (const candidate of local) {
    if (candidate === m) {
      hits.push(candidate);
    }
  }
  if (hits.length === 0) {
    return false;
  }
  return true;
}
function evaluateMethod(method) {
  if (typeof method !== "string") {
    return Object.fromEntries([["issues", ["bad-method"]], ["localOnly", null], ["method", null], ["requiresInit", null], ["valid", false]]);
  }
  if (method.length < 1) {
    return Object.fromEntries([["issues", ["bad-method"]], ["localOnly", null], ["method", method], ["requiresInit", null], ["valid", false]]);
  }
  if (method.length > 32) {
    return Object.fromEntries([["issues", ["bad-method"]], ["localOnly", null], ["method", method], ["requiresInit", null], ["valid", false]]);
  }
  if (isMethodCharsOk(method) === false) {
    return Object.fromEntries([["issues", ["bad-method"]], ["localOnly", null], ["method", method], ["requiresInit", null], ["valid", false]]);
  }
  if (isAllowlisted(method) === false) {
    return Object.fromEntries([["issues", ["bad-method"]], ["localOnly", null], ["method", method], ["requiresInit", null], ["valid", false]]);
  }
  const req = needsInit(method);
  const loc = isLocalOnly(method);
  return Object.fromEntries([["issues", []], ["localOnly", loc], ["method", method], ["requiresInit", req], ["valid", true]]);
}
function hasExactlyMethodKey(v) {
  if (typeof v !== "object") {
    return false;
  }
  if (v === null) {
    return false;
  }
  if (Array.isArray(v) === true) {
    return false;
  }
  const entries = Object.entries(v);
  if (entries.length !== 1) {
    return false;
  }
  const hits = [];
  for (const entry of entries) {
    const k = entry[0];
    if (k === "method") {
      hits.push(k);
    }
  }
  if (hits.length !== 1) {
    return false;
  }
  return true;
}
function hasExactlyRequestsKey(v) {
  if (typeof v !== "object") {
    return false;
  }
  if (v === null) {
    return false;
  }
  if (Array.isArray(v) === true) {
    return false;
  }
  const entries = Object.entries(v);
  if (entries.length !== 1) {
    return false;
  }
  const hits = [];
  for (const entry of entries) {
    const k = entry[0];
    if (k === "requests") {
      hits.push(k);
    }
  }
  if (hits.length !== 1) {
    return false;
  }
  return true;
}
export function runFeature(payload) {
  if (typeof payload !== "object") {
    return Object.fromEntries([["issues", ["bad-payload"]], ["kind", "unknown"], ["ok", false], ["value", null]]);
  }
  if (payload === null) {
    return Object.fromEntries([["issues", ["bad-payload"]], ["kind", "unknown"], ["ok", false], ["value", null]]);
  }
  if (Array.isArray(payload) === true) {
    return Object.fromEntries([["issues", ["bad-payload"]], ["kind", "unknown"], ["ok", false], ["value", null]]);
  }
  const payloadEntries = Object.entries(payload);
  const seenKind = [];
  const seenValue = [];
  for (const entry of payloadEntries) {
    const k = entry[0];
    if (k === "kind") {
      seenKind.push(k);
    }
    if (k === "value") {
      seenValue.push(k);
    }
  }
  if (seenKind.length !== 1) {
    return Object.fromEntries([["issues", ["bad-kind"]], ["kind", "unknown"], ["ok", false], ["value", null]]);
  }
  const kind = payload.kind;
  const value = payload.value;
  if (kind !== "check-init-dependency" && kind !== "check-init-dependency-batch") {
    return Object.fromEntries([["issues", ["bad-kind"]], ["kind", "unknown"], ["ok", false], ["value", null]]);
  }
  if (seenValue.length !== 1) {
    return Object.fromEntries([["issues", ["bad-value"]], ["kind", kind], ["ok", false], ["value", null]]);
  }
  if (kind === "check-init-dependency") {
    if (hasExactlyMethodKey(value) === false) {
      return Object.fromEntries([["issues", ["bad-value"]], ["kind", kind], ["ok", false], ["value", null]]);
    }
    const method = value.method;
    const evaluated = evaluateMethod(method);
    return Object.fromEntries([["kind", kind], ["ok", true], ["value", evaluated]]);
  }
  if (hasExactlyRequestsKey(value) === false) {
    return Object.fromEntries([["issues", ["bad-value"]], ["kind", kind], ["ok", false], ["value", null]]);
  }
  const requests = value.requests;
  if (Array.isArray(requests) === false) {
    return Object.fromEntries([["issues", ["bad-requests"]], ["kind", kind], ["ok", false], ["value", null]]);
  }
  if (requests.length > 16) {
    return Object.fromEntries([["issues", ["bad-requests"]], ["kind", kind], ["ok", false], ["value", null]]);
  }
  const badWrappers = [];
  for (const req of requests) {
    if (hasExactlyMethodKey(req) === false) {
      badWrappers.push(req);
    }
  }
  if (badWrappers.length !== 0) {
    return Object.fromEntries([["issues", ["bad-requests"]], ["kind", kind], ["ok", false], ["value", null]]);
  }
  const results = [];
  for (const req of requests) {
    const m = req.method;
    const r = evaluateMethod(m);
    results.push(r);
  }
  const orderedValue = Object.fromEntries([["results", results]]);
  return Object.fromEntries([["kind", kind], ["ok", true], ["value", orderedValue]]);
}
