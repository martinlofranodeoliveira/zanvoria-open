function isPlainObject(input) {
  if (input === null) {
    return false;
  }
  if (typeof input !== "object") {
    return false;
  }
  if (Array.isArray(input) === true) {
    return false;
  }
  return true;
}
function hasExactlyKindValue(obj) {
  if (Object.keys(obj).length !== 2) {
    return false;
  }
  for (const entry of Object.entries(obj)) {
    const k = entry[0];
    if (k !== "kind" && k !== "value") {
      return false;
    }
  }
  return true;
}
function hasExactlyMuted(obj) {
  if (Object.keys(obj).length !== 1) {
    return false;
  }
  for (const entry of Object.entries(obj)) {
    const k = entry[0];
    if (k !== "muted") {
      return false;
    }
  }
  return true;
}
function hasExactlyRequests(obj) {
  if (Object.keys(obj).length !== 1) {
    return false;
  }
  for (const entry of Object.entries(obj)) {
    const k = entry[0];
    if (k !== "requests") {
      return false;
    }
  }
  return true;
}
function isSafeMuteString(text) {
  if (typeof text !== "string") {
    return false;
  }
  if (text.length > 32) {
    return false;
  }
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code >= 55296 && code <= 57343) {
      return false;
    }
    if (code < 32) {
      if (code !== 9 && code !== 10 && code !== 13) {
        return false;
      }
    }
  }
  return true;
}
function isSafeMuteNumber(n) {
  if (typeof n !== "number") {
    return false;
  }
  if (Number.isFinite(n) === false) {
    return false;
  }
  if (Number.isSafeInteger(n) === false) {
    return false;
  }
  if (n > 9007199254740991) {
    return false;
  }
  if (n < -9007199254740991) {
    return false;
  }
  return true;
}
function isValidMuted(muted) {
  if (muted === null) {
    return true;
  }
  if (typeof muted === "boolean") {
    return true;
  }
  if (typeof muted === "number") {
    if (isSafeMuteNumber(muted) === false) {
      return false;
    }
    return true;
  }
  if (typeof muted === "string") {
    if (isSafeMuteString(muted) === false) {
      return false;
    }
    return true;
  }
  return false;
}
function toMutedState(muted) {
  if (muted === null) {
    return false;
  }
  if (muted === false) {
    return false;
  }
  if (muted === 0) {
    return false;
  }
  if (muted === "") {
    return false;
  }
  return true;
}
function echoMuted(muted) {
  if (muted === null) {
    return null;
  }
  if (typeof muted === "boolean") {
    return muted;
  }
  if (typeof muted === "number") {
    return muted;
  }
  if (typeof muted === "string") {
    return muted;
  }
  return null;
}
export function checkMuteFlag(muted) {
  if (isValidMuted(muted) === true) {
    const state = toMutedState(muted);
    const issues = [];
    return Object.fromEntries([
      ["issues", issues],
      ["muted", muted],
      ["mutedState", state],
      ["valid", true]
    ]);
  }
  const echoed = echoMuted(muted);
  const issues = [];
  issues.push("bad-mute-flag");
  return Object.fromEntries([
    ["issues", issues],
    ["muted", echoed],
    ["mutedState", null],
    ["valid", false]
  ]);
}
export function checkMuteFlagBatch(requests) {
  if (Array.isArray(requests) === false) {
    const empty = [];
    return Object.fromEntries([
      ["results", empty]
    ]);
  }
  const results = [];
  for (const req of requests) {
    const inner = req.muted;
    const one = checkMuteFlag(inner);
    results.push(one);
  }
  return Object.fromEntries([
    ["results", results]
  ]);
}
export function runFeature(payload) {
  if (isPlainObject(payload) === false) {
    const issues = [];
    issues.push("bad-payload");
    return Object.fromEntries([
      ["issues", issues],
      ["kind", "unknown"],
      ["ok", false],
      ["value", null]
    ]);
  }
  const kind = payload.kind;
  const value = payload.value;
  if (hasExactlyKindValue(payload) === false) {
    if (kind !== "check-mute-flag" && kind !== "check-mute-flag-batch") {
      const issues = [];
      issues.push("bad-kind");
      return Object.fromEntries([
        ["issues", issues],
        ["kind", "unknown"],
        ["ok", false],
        ["value", null]
      ]);
    }
    if (value === undefined) {
      const issues = [];
      issues.push("bad-value");
      return Object.fromEntries([
        ["issues", issues],
        ["kind", kind],
        ["ok", false],
        ["value", null]
      ]);
    }
    const issues = [];
    issues.push("bad-payload");
    return Object.fromEntries([
      ["issues", issues],
      ["kind", kind],
      ["ok", false],
      ["value", null]
    ]);
  }
  if (kind !== "check-mute-flag" && kind !== "check-mute-flag-batch") {
    const issues = [];
    issues.push("bad-kind");
    return Object.fromEntries([
      ["issues", issues],
      ["kind", "unknown"],
      ["ok", false],
      ["value", null]
    ]);
  }
  if (kind === "check-mute-flag") {
    if (isPlainObject(value) === false) {
      const issues = [];
      issues.push("bad-value");
      return {
        issues: issues,
        kind: kind,
        ok: false,
        value: null
      };
    }
    if (hasExactlyMuted(value) === false) {
      const issues = [];
      issues.push("bad-value");
      return {
        issues: issues,
        kind: kind,
        ok: false,
        value: null
      };
    }
    const muted = value.muted;
    const result = checkMuteFlag(muted);
    return {
      kind: kind,
      ok: true,
      value: result
    };
  }
  if (isPlainObject(value) === false) {
    const issues = [];
    issues.push("bad-value");
    return Object.fromEntries([
      ["issues", issues],
      ["kind", kind],
      ["ok", false],
      ["value", null]
    ]);
  }
  if (hasExactlyRequests(value) === false) {
    const issues = [];
    issues.push("bad-value");
    return Object.fromEntries([
      ["issues", issues],
      ["kind", kind],
      ["ok", false],
      ["value", null]
    ]);
  }
  const requests = value.requests;
  if (Array.isArray(requests) === false) {
    const issues = [];
    issues.push("bad-requests");
    return Object.fromEntries([
      ["issues", issues],
      ["kind", kind],
      ["ok", false],
      ["value", null]
    ]);
  }
  if (requests.length > 16) {
    const issues = [];
    issues.push("bad-requests");
    return Object.fromEntries([
      ["issues", issues],
      ["kind", kind],
      ["ok", false],
      ["value", null]
    ]);
  }
  for (const req of requests) {
    if (isPlainObject(req) === false) {
      const issues = [];
      issues.push("bad-requests");
      return Object.fromEntries([
        ["issues", issues],
        ["kind", kind],
        ["ok", false],
        ["value", null]
      ]);
    }
    if (hasExactlyMuted(req) === false) {
      const issues = [];
      issues.push("bad-requests");
      return Object.fromEntries([
        ["issues", issues],
        ["kind", kind],
        ["ok", false],
        ["value", null]
      ]);
    }
  }
  const results = [];
  for (const req of requests) {
    const inner = req.muted;
    const one = checkMuteFlag(inner);
    results.push(one);
  }
  const batchValue = Object.fromEntries([
    ["results", results]
  ]);
  return Object.fromEntries([
    ["kind", kind],
    ["ok", true],
    ["value", batchValue]
  ]);
}
