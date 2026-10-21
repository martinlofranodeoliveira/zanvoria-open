export function runFeature(payload) {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload) === true) {
    const pairs = [];
    pairs.push(["issues", ["bad-payload"]]);
    pairs.push(["kind", "unknown"]);
    pairs.push(["ok", false]);
    pairs.push(["value", null]);
    return Object.fromEntries(pairs);
  }
  const kind = payload.kind;
  if (typeof kind !== "string") {
    const pairs = [];
    pairs.push(["issues", ["bad-kind"]]);
    pairs.push(["kind", "unknown"]);
    pairs.push(["ok", false]);
    pairs.push(["value", null]);
    return Object.fromEntries(pairs);
  }
  if (kind !== "check-store-key" && kind !== "check-store-key-batch") {
    const pairs = [];
    pairs.push(["issues", ["bad-kind"]]);
    pairs.push(["kind", "unknown"]);
    pairs.push(["ok", false]);
    pairs.push(["value", null]);
    return Object.fromEntries(pairs);
  }
  const hasValue = hasValueField(payload);
  if (hasValue === false) {
    const pairs = [];
    pairs.push(["issues", ["bad-value"]]);
    pairs.push(["kind", kind]);
    pairs.push(["ok", false]);
    pairs.push(["value", null]);
    return Object.fromEntries(pairs);
  }
  const value = payload.value;
  if (kind === "check-store-key") {
    if (isExactStoreKeyObject(value) === false) {
      const pairs = [];
      pairs.push(["issues", ["bad-value"]]);
      pairs.push(["kind", kind]);
      pairs.push(["ok", false]);
      pairs.push(["value", null]);
      return Object.fromEntries(pairs);
    }
    const storeKey = value.storeKey;
    const inner = makeSingleResult(storeKey);
    return {kind: kind, ok: true, value: inner};
  }
  if (isExactRequestsObject(value) === false) {
    const pairs = [];
    pairs.push(["issues", ["bad-value"]]);
    pairs.push(["kind", kind]);
    pairs.push(["ok", false]);
    pairs.push(["value", null]);
    return Object.fromEntries(pairs);
  }
  const requests = value.requests;
  if (Array.isArray(requests) === false) {
    const pairs = [];
    pairs.push(["issues", ["bad-requests"]]);
    pairs.push(["kind", kind]);
    pairs.push(["ok", false]);
    pairs.push(["value", null]);
    return Object.fromEntries(pairs);
  }
  if (requests.length > 16) {
    const pairs = [];
    pairs.push(["issues", ["bad-requests"]]);
    pairs.push(["kind", kind]);
    pairs.push(["ok", false]);
    pairs.push(["value", null]);
    return Object.fromEntries(pairs);
  }
  for (const req of requests) {
    if (isExactStoreKeyObject(req) === false) {
      const pairs = [];
      pairs.push(["issues", ["bad-requests"]]);
      pairs.push(["kind", kind]);
      pairs.push(["ok", false]);
      pairs.push(["value", null]);
      return Object.fromEntries(pairs);
    }
  }
  const results = [];
  for (const req of requests) {
    const sk = req.storeKey;
    const r = makeSingleResult(sk);
    results.push(r);
  }
  return {kind: kind, ok: true, value: {results: results}};
}
function hasValueField(obj) {
  for (const entry of Object.entries(obj)) {
    if (entry[0] === "value") {
      return true;
    }
  }
  return false;
}
function isExactStoreKeyObject(v) {
  if (typeof v !== "object" || v === null || Array.isArray(v) === true) {
    return false;
  }
  const entries = Object.entries(v);
  if (entries.length !== 1) {
    return false;
  }
  const first = entries[0];
  if (first[0] !== "storeKey") {
    return false;
  }
  return true;
}
function isExactRequestsObject(v) {
  if (typeof v !== "object" || v === null || Array.isArray(v) === true) {
    return false;
  }
  const entries = Object.entries(v);
  if (entries.length !== 1) {
    return false;
  }
  const first = entries[0];
  if (first[0] !== "requests") {
    return false;
  }
  return true;
}
function makeSingleResult(storeKeyInput) {
  if (typeof storeKeyInput !== "string") {
    const pairs = [];
    pairs.push(["allowed", false]);
    pairs.push(["issues", ["bad-store-key"]]);
    pairs.push(["reason", null]);
    pairs.push(["storeKey", null]);
    pairs.push(["valid", false]);
    return Object.fromEntries(pairs);
  }
  if (storeKeyInput.length < 1) {
    const pairs = [];
    pairs.push(["allowed", false]);
    pairs.push(["issues", ["bad-store-key"]]);
    pairs.push(["reason", null]);
    pairs.push(["storeKey", storeKeyInput]);
    pairs.push(["valid", false]);
    return Object.fromEntries(pairs);
  }
  if (storeKeyInput.length > 64) {
    const pairs = [];
    pairs.push(["allowed", false]);
    pairs.push(["issues", ["bad-store-key"]]);
    pairs.push(["reason", null]);
    pairs.push(["storeKey", storeKeyInput]);
    pairs.push(["valid", false]);
    return Object.fromEntries(pairs);
  }
  for (const ch of storeKeyInput) {
    const code = ch.codePointAt(0);
    const isDigit = code >= 48 && code <= 57;
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    const isColon = code === 58;
    const isHyphen = code === 45;
    const isUnderscore = code === 95;
    if (isDigit === false && isUpper === false && isLower === false && isColon === false && isHyphen === false && isUnderscore === false) {
      const pairs = [];
      pairs.push(["allowed", false]);
      pairs.push(["issues", ["bad-store-key"]]);
      pairs.push(["reason", null]);
      pairs.push(["storeKey", storeKeyInput]);
      pairs.push(["valid", false]);
      return Object.fromEntries(pairs);
    }
  }
  const isSave = storeKeyInput === "aether-rift:wildbound:save";
  const isSettings = storeKeyInput === "aether-rift:wildbound:settings";
  const isLast = storeKeyInput === "aether-rift:wildbound:last-score";
  if (isSave === true || isSettings === true || isLast === true) {
    const pairs = [];
    pairs.push(["allowed", true]);
    pairs.push(["issues", []]);
    pairs.push(["reason", null]);
    pairs.push(["storeKey", storeKeyInput]);
    pairs.push(["valid", true]);
    return Object.fromEntries(pairs);
  }
  const pairs = [];
  pairs.push(["allowed", false]);
  pairs.push(["issues", []]);
  pairs.push(["reason", "unlisted-key"]);
  pairs.push(["storeKey", storeKeyInput]);
  pairs.push(["valid", true]);
  return Object.fromEntries(pairs);
}
