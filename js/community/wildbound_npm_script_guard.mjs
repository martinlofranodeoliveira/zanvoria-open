function isValidScriptText(scriptVal) {
  if (typeof scriptVal !== "string") {
    return false;
  }
  if (scriptVal.length < 1) {
    return false;
  }
  if (scriptVal.length > 32) {
    return false;
  }
  for (const ch of scriptVal) {
    const isUpper = ch >= "A" && ch <= "Z";
    const isLower = ch >= "a" && ch <= "z";
    const isHyphen = ch === "-";
    const isUnderscore = ch === "_";
    if (isUpper === true) {
    } else if (isLower === true) {
    } else if (isHyphen === true) {
    } else if (isUnderscore === true) {
    } else {
      return false;
    }
  }
  return true;
}
function buildGuardResult(allowed, issues, reason, script, valid) {
  const entries = [];
  entries.push(["allowed", allowed]);
  entries.push(["issues", issues]);
  entries.push(["reason", reason]);
  entries.push(["script", script]);
  entries.push(["valid", valid]);
  return Object.fromEntries(entries);
}
function evaluateScriptValue(scriptVal) {
  if (typeof scriptVal !== "string") {
    const issues = [];
    issues.push("bad-script");
    return buildGuardResult(false, issues, null, null, false);
  }
  const valid = isValidScriptText(scriptVal);
  if (valid === false) {
    const issues2 = [];
    issues2.push("bad-script");
    return buildGuardResult(false, issues2, null, scriptVal, false);
  }
  const allowed = scriptVal === "check" || scriptVal === "test" || scriptVal === "start";
  if (allowed === true) {
    const issues3 = [];
    return buildGuardResult(true, issues3, null, scriptVal, true);
  }
  const issues4 = [];
  return buildGuardResult(false, issues4, "unknown-script", scriptVal, true);
}
export function checkNpmScript(value) {
  if (typeof value === "string") {
    return evaluateScriptValue(value);
  }
  if (typeof value !== "object") {
    const issues = [];
    issues.push("bad-script");
    return buildGuardResult(false, issues, null, null, false);
  }
  if (value === null) {
    const issues2 = [];
    issues2.push("bad-script");
    return buildGuardResult(false, issues2, null, null, false);
  }
  if (Array.isArray(value) === true) {
    const issues3 = [];
    issues3.push("bad-script");
    return buildGuardResult(false, issues3, null, null, false);
  }
  const entries = Object.entries(value);
  if (entries.length !== 1) {
    const issues4 = [];
    issues4.push("bad-script");
    return buildGuardResult(false, issues4, null, null, false);
  }
  for (const entry of entries) {
    const k = entry[0];
    const v = entry[1];
    if (k === "script") {
      return evaluateScriptValue(v);
    }
    const issues5 = [];
    issues5.push("bad-script");
    return buildGuardResult(false, issues5, null, null, false);
  }
  const issues6 = [];
  issues6.push("bad-script");
  return buildGuardResult(false, issues6, null, null, false);
}
export function checkNpmScriptBatch(value) {
  if (Array.isArray(value) === true) {
    const results = [];
    for (const req of value) {
      const r = checkNpmScript(req);
      results.push(r);
    }
    return results;
  }
  if (typeof value !== "object") {
    return [];
  }
  if (value === null) {
    return [];
  }
  const entries = Object.entries(value);
  if (entries.length !== 1) {
    return [];
  }
  for (const entry of entries) {
    const k = entry[0];
    const v = entry[1];
    if (k === "requests") {
      if (Array.isArray(v) === false) {
        return [];
      }
      if (v.length > 16) {
        return [];
      }
      const results2 = [];
      for (const req2 of v) {
        const r2 = checkNpmScript(req2);
        results2.push(r2);
      }
      return results2;
    }
    return [];
  }
  return [];
}
export function runFeature(payload) {
  if (typeof payload !== "object") {
    const issues = [];
    issues.push("bad-payload");
    return {issues: issues, kind: "unknown", ok: false, value: null};
  }
  if (payload === null) {
    const issues2 = [];
    issues2.push("bad-payload");
    return {issues: issues2, kind: "unknown", ok: false, value: null};
  }
  if (Array.isArray(payload) === true) {
    const issues3 = [];
    issues3.push("bad-payload");
    return {issues: issues3, kind: "unknown", ok: false, value: null};
  }
  for (const entry of Object.entries(payload)) {
    const ek = entry[0];
    if (ek === "kind") {
    }
    if (ek === "value") {
    }
  }
  const kind = payload.kind;
  const value = payload.value;
  if (typeof kind !== "string") {
    const issues4 = [];
    issues4.push("bad-kind");
    return {issues: issues4, kind: "unknown", ok: false, value: null};
  }
  if (kind !== "check-npm-script" && kind !== "check-npm-script-batch") {
    const issues5 = [];
    issues5.push("bad-kind");
    return {issues: issues5, kind: "unknown", ok: false, value: null};
  }
  if (kind === "check-npm-script") {
    if (typeof value !== "object") {
      const issues6 = [];
      issues6.push("bad-value");
      return {issues: issues6, kind: "check-npm-script", ok: false, value: null};
    }
    if (value === null) {
      const issues7 = [];
      issues7.push("bad-value");
      return {issues: issues7, kind: "check-npm-script", ok: false, value: null};
    }
    if (Array.isArray(value) === true) {
      const issues8 = [];
      issues8.push("bad-value");
      return {issues: issues8, kind: "check-npm-script", ok: false, value: null};
    }
    const ventries = Object.entries(value);
    if (ventries.length !== 1) {
      const issues9 = [];
      issues9.push("bad-value");
      return {issues: issues9, kind: "check-npm-script", ok: false, value: null};
    }
    for (const ventry of ventries) {
      const vk = ventry[0];
      if (vk === "script") {
      }
      if (vk !== "script") {
        const issues10 = [];
        issues10.push("bad-value");
        return {issues: issues10, kind: "check-npm-script", ok: false, value: null};
      }
    }
    const result = checkNpmScript(value);
    return {kind: "check-npm-script", ok: true, value: result};
  }
  if (typeof value !== "object") {
    const issues11 = [];
    issues11.push("bad-requests");
    return {issues: issues11, kind: "check-npm-script-batch", ok: false, value: null};
  }
  if (value === null) {
    const issues12 = [];
    issues12.push("bad-requests");
    return {issues: issues12, kind: "check-npm-script-batch", ok: false, value: null};
  }
  if (Array.isArray(value) === true) {
    const issues13 = [];
    issues13.push("bad-requests");
    return {issues: issues13, kind: "check-npm-script-batch", ok: false, value: null};
  }
  const bentries = Object.entries(value);
  if (bentries.length !== 1) {
    const issues14 = [];
    issues14.push("bad-requests");
    return {issues: issues14, kind: "check-npm-script-batch", ok: false, value: null};
  }
  for (const bentry of bentries) {
    const bk = bentry[0];
    if (bk !== "requests") {
      const issues15 = [];
      issues15.push("bad-requests");
      return {issues: issues15, kind: "check-npm-script-batch", ok: false, value: null};
    }
  }
  const requests = value.requests;
  if (Array.isArray(requests) === false) {
    const issues16 = [];
    issues16.push("bad-requests");
    return {issues: issues16, kind: "check-npm-script-batch", ok: false, value: null};
  }
  if (requests.length > 16) {
    const issues17 = [];
    issues17.push("bad-requests");
    return {issues: issues17, kind: "check-npm-script-batch", ok: false, value: null};
  }
  const results = [];
  for (const req of requests) {
    const r = checkNpmScript(req);
    results.push(r);
  }
  const ventries2 = [];
  ventries2.push(["results", results]);
  const orderedValue = Object.fromEntries(ventries2);
  return {kind: "check-npm-script-batch", ok: true, value: orderedValue};
}
