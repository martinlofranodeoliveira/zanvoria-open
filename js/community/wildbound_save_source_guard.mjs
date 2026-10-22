function isPlainObject(candidate) {
  if (typeof candidate !== "object") {
    return false;
  }
  if (candidate === null) {
    return false;
  }
  if (Array.isArray(candidate) === true) {
    return false;
  }
  return true;
}
function isNullableClean(candidate) {
  if (candidate === null) {
    return true;
  }
  if (typeof candidate !== "string") {
    return false;
  }
  if (candidate.length > 512) {
    return false;
  }
  for (const ch of candidate) {
    const code = ch.codePointAt(0);
    if (code === 9) {
      continue;
    }
    if (code === 10) {
      continue;
    }
    if (code === 13) {
      continue;
    }
    if (code < 32) {
      return false;
    }
  }
  return true;
}
function hasExactSaveKeys(candidate) {
  const entries = Object.entries(candidate);
  if (entries.length !== 3) {
    return false;
  }
  const keys = [];
  for (const entry of entries) {
    const k = entry[0];
    keys.push(k);
  }
  if (keys.includes("localValue") === false) {
    return false;
  }
  if (keys.includes("sdkAvailable") === false) {
    return false;
  }
  if (keys.includes("sdkValue") === false) {
    return false;
  }
  return true;
}
function hasExactRequestsKey(candidate) {
  const entries = Object.entries(candidate);
  if (entries.length !== 1) {
    return false;
  }
  const keys = [];
  for (const entry of entries) {
    const k = entry[0];
    keys.push(k);
  }
  if (keys.includes("requests") === false) {
    return false;
  }
  return true;
}
export function checkSaveSource(request) {
  if (isPlainObject(request) === false) {
    const issues = [];
    issues.push("bad-sdk-flag");
    issues.push("bad-sdk-value");
    issues.push("bad-local-value");
    const parts = [];
    parts.push(["issues", issues]);
    parts.push(["localValue", null]);
    parts.push(["resolved", null]);
    parts.push(["sdkAvailable", null]);
    parts.push(["sdkValue", null]);
    parts.push(["source", null]);
    parts.push(["valid", false]);
    return Object.fromEntries(parts);
  }
  const flag = request.sdkAvailable;
  const sdkVal = request.sdkValue;
  const localVal = request.localValue;
  const exact = hasExactSaveKeys(request);
  const flagOk = typeof flag === "boolean";
  const sdkOk = isNullableClean(sdkVal);
  const localOk = isNullableClean(localVal);
  const issues = [];
  if (flagOk === false) {
    issues.push("bad-sdk-flag");
  }
  if (sdkOk === false) {
    issues.push("bad-sdk-value");
  }
  if (localOk === false) {
    issues.push("bad-local-value");
  }
  if (exact === false) {
    if (issues.length === 0) {
      issues.push("bad-local-value");
    }
  }
  const flagEcho = flagOk === true ? flag : null;
  const sdkEcho = sdkVal === null ? null : (typeof sdkVal === "string" ? sdkVal : null);
  const localEcho = localVal === null ? null : (typeof localVal === "string" ? localVal : null);
  const fieldsOk = flagOk === true && sdkOk === true && localOk === true;
  const valid = fieldsOk === true && exact === true;
  if (valid === false) {
    const parts = [];
    parts.push(["issues", issues]);
    parts.push(["localValue", localEcho]);
    parts.push(["resolved", null]);
    parts.push(["sdkAvailable", flagEcho]);
    parts.push(["sdkValue", sdkEcho]);
    parts.push(["source", null]);
    parts.push(["valid", false]);
    return Object.fromEntries(parts);
  }
  const useSdk = flag === true && sdkVal !== null;
  const source = useSdk === true ? "sdk" : (localVal !== null ? "local" : "empty");
  const resolved = source === "sdk" ? sdkVal : (source === "local" ? localVal : null);
  const goodParts = [];
  goodParts.push(["issues", issues]);
  goodParts.push(["localValue", localEcho]);
  goodParts.push(["resolved", resolved]);
  goodParts.push(["sdkAvailable", flagEcho]);
  goodParts.push(["sdkValue", sdkEcho]);
  goodParts.push(["source", source]);
  goodParts.push(["valid", true]);
  return Object.fromEntries(goodParts);
}
export function checkSaveSourceBatch(requests) {
  if (Array.isArray(requests) === false) {
    return [];
  }
  const results = [];
  for (const item of requests) {
    const one = checkSaveSource(item);
    results.push(one);
  }
  return results;
}
export function runFeature(payload) {
  if (isPlainObject(payload) === false) {
    return {
      issues: ["bad-payload"],
      kind: "unknown",
      ok: false,
      value: null
    };
  }
  const kind = payload.kind;
  if (kind !== "check-save-source" && kind !== "check-save-source-batch") {
    return {
      issues: ["bad-kind"],
      kind: "unknown",
      ok: false,
      value: null
    };
  }
  if (kind === "check-save-source") {
    const singleVal = payload.value;
    if (isPlainObject(singleVal) === false) {
      return {
        issues: ["bad-value"],
        kind: "check-save-source",
        ok: false,
        value: null
      };
    }
    if (hasExactSaveKeys(singleVal) === false) {
      return {
        issues: ["bad-value"],
        kind: "check-save-source",
        ok: false,
        value: null
      };
    }
    const result = checkSaveSource(singleVal);
    return {
      kind: "check-save-source",
      ok: true,
      value: result
    };
  }
  const batchVal = payload.value;
  if (isPlainObject(batchVal) === false) {
    return {
      issues: ["bad-value"],
      kind: "check-save-source-batch",
      ok: false,
      value: null
    };
  }
  if (hasExactRequestsKey(batchVal) === false) {
    return {
      issues: ["bad-value"],
      kind: "check-save-source-batch",
      ok: false,
      value: null
    };
  }
  const requests = batchVal.requests;
  if (Array.isArray(requests) === false) {
    return {
      issues: ["bad-requests"],
      kind: "check-save-source-batch",
      ok: false,
      value: null
    };
  }
  if (requests.length > 16) {
    return {
      issues: ["bad-requests"],
      kind: "check-save-source-batch",
      ok: false,
      value: null
    };
  }
  const results = [];
  for (const item of requests) {
    const one = checkSaveSource(item);
    results.push(one);
  }
  return {
    kind: "check-save-source-batch",
    ok: true,
    value: {
      results: results
    }
  };
}
