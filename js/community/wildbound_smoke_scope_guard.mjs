function isPlainObject(candidate) {
  const typeOk = typeof candidate === "object";
  if (typeOk === false) {
    return false;
  }
  const notNull = candidate !== null;
  if (notNull === false) {
    return false;
  }
  const isArray = Array.isArray(candidate);
  if (isArray === true) {
    return false;
  }
  return true;
}
function isClaimText(candidate) {
  const isString = typeof candidate === "string";
  if (isString === false) {
    return false;
  }
  const textLength = candidate.length;
  const tooShort = textLength < 1;
  if (tooShort === true) {
    return false;
  }
  const tooLong = textLength > 64;
  if (tooLong === true) {
    return false;
  }
  for (const ch of candidate) {
    const isHyphen = ch === "-";
    const atLeastA = ch >= "a";
    const atMostZ = ch <= "z";
    const single = ch.length === 1;
    const inRange = atLeastA === true && atMostZ === true;
    const lowerOk = inRange === true && single === true;
    const ok = isHyphen === true || lowerOk === true;
    if (ok === false) {
      return false;
    }
  }
  return true;
}
function isAllowedClaim(claim) {
  const a = claim === "javascript-syntax";
  const b = claim === "local-http-serving";
  const c = claim === "denied-private-paths";
  const d = claim === "unsupported-writes";
  const e = claim === "manual-open-start";
  const f = claim === "procedural-renderer";
  const any = a === true || b === true || c === true || d === true || e === true || f === true;
  return any;
}
function isSingleValueShape(candidate) {
  const isObj = isPlainObject(candidate);
  if (isObj === false) {
    return false;
  }
  const all = Object.entries(candidate);
  const count = all.length;
  const one = count === 1;
  if (one === false) {
    return false;
  }
  for (const entry of Object.entries(candidate)) {
    const key = entry[0];
    const isClaim = key === "claim";
    if (isClaim === false) {
      return false;
    }
  }
  return true;
}
function isBatchValueShape(candidate) {
  const isObj = isPlainObject(candidate);
  if (isObj === false) {
    return false;
  }
  const all = Object.entries(candidate);
  const count = all.length;
  const one = count === 1;
  if (one === false) {
    return false;
  }
  for (const entry of Object.entries(candidate)) {
    const key = entry[0];
    const isReq = key === "requests";
    if (isReq === false) {
      return false;
    }
    const req = entry[1];
    const isArr = Array.isArray(req);
    if (isArr === false) {
      return false;
    }
    const len = req.length;
    const tooMany = len > 16;
    if (tooMany === true) {
      return false;
    }
    for (const item of req) {
      const itemOk = isSingleValueShape(item);
      if (itemOk === false) {
        return false;
      }
    }
  }
  return true;
}
function getClaimEcho(value) {
  const isObj = isPlainObject(value);
  if (isObj === false) {
    return null;
  }
  const found = value.claim;
  const isStr = typeof found === "string";
  if (isStr === true) {
    return found;
  }
  return null;
}
function buildUnknown(issue) {
  const list = [];
  list.push(issue);
  const parts = [];
  parts.push(["issues", list]);
  parts.push(["kind", "unknown"]);
  parts.push(["ok", false]);
  parts.push(["value", null]);
  return Object.fromEntries(parts);
}
function buildKindError(kind, issue) {
  const list = [];
  list.push(issue);
  const parts = [];
  parts.push(["issues", list]);
  parts.push(["kind", kind]);
  parts.push(["ok", false]);
  parts.push(["value", null]);
  return Object.fromEntries(parts);
}
export function checkSmokeScope(value) {
  const shapeOk = isSingleValueShape(value);
  const rawClaim = getClaimEcho(value);
  const textOk = isClaimText(rawClaim);
  const valid = shapeOk === true && textOk === true;
  const isValid = valid === true;
  if (isValid === true) {
    const allowed = isAllowedClaim(rawClaim);
    if (allowed === true) {
      const empty = [];
      const parts = [];
      parts.push(["allowed", true]);
      parts.push(["claim", rawClaim]);
      parts.push(["issues", empty]);
      parts.push(["reason", null]);
      parts.push(["valid", true]);
      return Object.fromEntries(parts);
    }
    const none = [];
    const outParts = [];
    outParts.push(["allowed", false]);
    outParts.push(["claim", rawClaim]);
    outParts.push(["issues", none]);
    outParts.push(["reason", "out-of-scope"]);
    outParts.push(["valid", true]);
    return Object.fromEntries(outParts);
  }
  const bad = [];
  bad.push("bad-claim");
  const badParts = [];
  badParts.push(["allowed", false]);
  badParts.push(["claim", rawClaim]);
  badParts.push(["issues", bad]);
  badParts.push(["reason", null]);
  badParts.push(["valid", false]);
  return Object.fromEntries(badParts);
}
export function checkSmokeScopeBatch(value) {
  const isObj = isPlainObject(value);
  if (isObj === false) {
    return { results: [] };
  }
  const req = value.requests;
  const isArr = Array.isArray(req);
  if (isArr === false) {
    return { results: [] };
  }
  const results = [];
  for (const item of req) {
    const one = checkSmokeScope(item);
    results.push(one);
  }
  return { results: results };
}
export function runFeature(payload) {
  const payloadOk = isPlainObject(payload);
  if (payloadOk === false) {
    return buildUnknown("bad-payload");
  }
  const kindHolders = [];
  const valueHolders = [];
  for (const entry of Object.entries(payload)) {
    const key = entry[0];
    const val = entry[1];
    const isKindKey = key === "kind";
    if (isKindKey === true) {
      kindHolders.push(val);
    }
    const isValueKey = key === "value";
    if (isValueKey === true) {
      valueHolders.push(val);
    }
  }
  const hasKind = kindHolders.length === 1;
  if (hasKind === false) {
    return buildUnknown("bad-kind");
  }
  const inputKind = kindHolders[0];
  const isSingle = inputKind === "check-smoke-scope";
  const isBatch = inputKind === "check-smoke-scope-batch";
  const known = isSingle === true || isBatch === true;
  if (known === false) {
    return buildUnknown("bad-kind");
  }
  const hasValue = valueHolders.length === 1;
  if (hasValue === false) {
    if (isSingle === true) {
      return buildKindError(inputKind, "bad-value");
    }
    return buildKindError(inputKind, "bad-requests");
  }
  const inputValue = valueHolders[0];
  if (isSingle === true) {
    const singleOk = isSingleValueShape(inputValue);
    if (singleOk === false) {
      return buildKindError(inputKind, "bad-value");
    }
    const inner = checkSmokeScope(inputValue);
    return { kind: inputKind, ok: true, value: inner };
  }
  const batchOk = isBatchValueShape(inputValue);
  if (batchOk === false) {
    return buildKindError(inputKind, "bad-requests");
  }
  const batchInner = checkSmokeScopeBatch(inputValue);
  return { kind: inputKind, ok: true, value: batchInner };
}
