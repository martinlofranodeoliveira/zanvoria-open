export function checkPushPath(value) {
  if (isSingleEnvelope(value) === false) {
    if (isPlainObject(value) === true) {
      if (typeof value.path === "string") {
        const echo = value.path;
        const issues = [];
        issues.push("bad-path");
        const entries = [];
        entries.push(["allowed", false]);
        entries.push(["blockedReason", null]);
        entries.push(["issues", issues]);
        entries.push(["path", echo]);
        entries.push(["valid", false]);
        return Object.fromEntries(entries);
      }
    }
    const issues = [];
    issues.push("bad-path");
    const entries = [];
    entries.push(["allowed", false]);
    entries.push(["blockedReason", null]);
    entries.push(["issues", issues]);
    entries.push(["path", null]);
    entries.push(["valid", false]);
    return Object.fromEntries(entries);
  }
  return evaluatePushPath(value);
}
export function checkPushPathBatch(value) {
  if (isBatchEnvelope(value) === false) {
    const empty = [];
    const entries = [];
    entries.push(["results", empty]);
    return Object.fromEntries(entries);
  }
  const requests = value.requests;
  if (Array.isArray(requests) === false) {
    const empty = [];
    const entries = [];
    entries.push(["results", empty]);
    return Object.fromEntries(entries);
  }
  if (requests.length > 16) {
    const empty = [];
    const entries = [];
    entries.push(["results", empty]);
    return Object.fromEntries(entries);
  }
  for (const req of requests) {
    if (isSingleEnvelope(req) === false) {
      const empty = [];
      const entries = [];
      entries.push(["results", empty]);
      return Object.fromEntries(entries);
    }
  }
  const results = [];
  for (const req of requests) {
    results.push(evaluatePushPath(req));
  }
  const entries = [];
  entries.push(["results", results]);
  return Object.fromEntries(entries);
}
export function runFeature(payload) {
  if (isPlainObject(payload) === false) {
    return makeError("unknown", "bad-payload");
  }
  const payloadKind = payload.kind;
  if (payloadKind !== "check-push-path") {
    if (payloadKind !== "check-push-path-batch") {
      return makeError("unknown", "bad-kind");
    }
  }
  const payloadEntries = Object.entries(payload);
  const seen = [];
  for (const entry of payloadEntries) {
    seen.push(entry[0]);
  }
  if (seen.includes("kind") === false) {
    return makeError("unknown", "bad-kind");
  }
  if (seen.includes("value") === false) {
    return makeError(payloadKind, "bad-payload");
  }
  const payloadValue = payload.value;
  if (payloadKind === "check-push-path") {
    if (isSingleEnvelope(payloadValue) === false) {
      return makeError(payloadKind, "bad-value");
    }
    const single = evaluatePushPath(payloadValue);
    return {
      kind: payloadKind,
      ok: true,
      value: single
    };
  }
  if (isBatchEnvelope(payloadValue) === false) {
    return makeError(payloadKind, "bad-value");
  }
  const requests = payloadValue.requests;
  if (Array.isArray(requests) === false) {
    return makeError(payloadKind, "bad-requests");
  }
  if (requests.length > 16) {
    return makeError(payloadKind, "bad-requests");
  }
  for (const req of requests) {
    if (isSingleEnvelope(req) === false) {
      return makeError(payloadKind, "bad-requests");
    }
  }
  const results = [];
  for (const req of requests) {
    results.push(evaluatePushPath(req));
  }
  const valueEntries = [];
  valueEntries.push(["results", results]);
  const batchValue = Object.fromEntries(valueEntries);
  return {
    kind: payloadKind,
    ok: true,
    value: batchValue
  };
}
function evaluatePushPath(value) {
  const raw = value.path;
  if (isValidPathText(raw) === false) {
    const echo = typeof raw === "string" ? raw : null;
    const issues = [];
    issues.push("bad-path");
    const entries = [];
    entries.push(["allowed", false]);
    entries.push(["blockedReason", null]);
    entries.push(["issues", issues]);
    entries.push(["path", echo]);
    entries.push(["valid", false]);
    return Object.fromEntries(entries);
  }
  if (isDotfileDenied(raw) === true) {
    const issues = [];
    const entries = [];
    entries.push(["allowed", false]);
    entries.push(["blockedReason", "dotfile-denied"]);
    entries.push(["issues", issues]);
    entries.push(["path", raw]);
    entries.push(["valid", true]);
    return Object.fromEntries(entries);
  }
  const lower = raw.toLowerCase();
  if (lower.includes("chave") === true) {
    const issues = [];
    const entries = [];
    entries.push(["allowed", false]);
    entries.push(["blockedReason", "sensitive-push-denied"]);
    entries.push(["issues", issues]);
    entries.push(["path", raw]);
    entries.push(["valid", true]);
    return Object.fromEntries(entries);
  }
  if (lower.includes("banco") === true) {
    const issues = [];
    const entries = [];
    entries.push(["allowed", false]);
    entries.push(["blockedReason", "sensitive-push-denied"]);
    entries.push(["issues", issues]);
    entries.push(["path", raw]);
    entries.push(["valid", true]);
    return Object.fromEntries(entries);
  }
  if (lower.includes("upload") === true) {
    const issues = [];
    const entries = [];
    entries.push(["allowed", false]);
    entries.push(["blockedReason", "sensitive-push-denied"]);
    entries.push(["issues", issues]);
    entries.push(["path", raw]);
    entries.push(["valid", true]);
    return Object.fromEntries(entries);
  }
  if (lower.includes("pessoal") === true) {
    const issues = [];
    const entries = [];
    entries.push(["allowed", false]);
    entries.push(["blockedReason", "sensitive-push-denied"]);
    entries.push(["issues", issues]);
    entries.push(["path", raw]);
    entries.push(["valid", true]);
    return Object.fromEntries(entries);
  }
  const issues = [];
  const entries = [];
  entries.push(["allowed", true]);
  entries.push(["blockedReason", null]);
  entries.push(["issues", issues]);
  entries.push(["path", raw]);
  entries.push(["valid", true]);
  return Object.fromEntries(entries);
}
function isDotfileDenied(given) {
  const segments = given.split("/");
  for (const segment of segments) {
    if (segment.startsWith(".") === true) {
      return true;
    }
  }
  return false;
}
function isValidPathText(given) {
  if (typeof given !== "string") {
    return false;
  }
  if (given.length < 1) {
    return false;
  }
  if (given.length > 128) {
    return false;
  }
  for (const ch of given) {
    const isSlash = ch === "/";
    const isDot = ch === ".";
    const isHyphen = ch === "-";
    const isUnderscore = ch === "_";
    const isUpper = ch >= "A" && ch <= "Z";
    const isLower = ch >= "a" && ch <= "z";
    const isDigit = ch >= "0" && ch <= "9";
    const allowed = isSlash === true || isDot === true || isHyphen === true || isUnderscore === true || isUpper === true || isLower === true || isDigit === true;
    if (allowed === false) {
      return false;
    }
  }
  return true;
}
function isSingleEnvelope(given) {
  if (isPlainObject(given) === false) {
    return false;
  }
  const entries = Object.entries(given);
  if (entries.length !== 1) {
    return false;
  }
  const keys = [];
  for (const entry of entries) {
    keys.push(entry[0]);
  }
  if (keys.includes("path") === false) {
    return false;
  }
  return true;
}
function isBatchEnvelope(given) {
  if (isPlainObject(given) === false) {
    return false;
  }
  const entries = Object.entries(given);
  if (entries.length !== 1) {
    return false;
  }
  const keys = [];
  for (const entry of entries) {
    keys.push(entry[0]);
  }
  if (keys.includes("requests") === false) {
    return false;
  }
  return true;
}
function isPlainObject(given) {
  if (given === null) {
    return false;
  }
  if (typeof given !== "object") {
    return false;
  }
  if (Array.isArray(given) === true) {
    return false;
  }
  return true;
}
function makeError(kindValue, reason) {
  const issues = [];
  issues.push(reason);
  const entries = [];
  entries.push(["issues", issues]);
  entries.push(["kind", kindValue]);
  entries.push(["ok", false]);
  entries.push(["value", null]);
  return Object.fromEntries(entries);
}
