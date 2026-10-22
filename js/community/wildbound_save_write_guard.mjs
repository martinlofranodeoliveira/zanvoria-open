export function checkSaveWrite(value) {
  const isObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
  const rawSdk = isObj === true ? value.sdkWritable : null;
  const rawUsing = isObj === true ? value.usingCrazyGames : null;
  const sdkOk = typeof rawSdk === "boolean";
  const usingOk = typeof rawUsing === "boolean";
  const sdkEcho = sdkOk === true ? rawSdk : null;
  const usingEcho = usingOk === true ? rawUsing : null;
  const issues = [];
  if (sdkOk === false) {
    issues.push("bad-sdk-writable");
  }
  if (usingOk === false) {
    issues.push("bad-using-flag");
  }
  const valid = issues.length === 0;
  const localWrite = valid === true ? true : null;
  const bothTrue = sdkEcho === true && usingEcho === true;
  const sdkWrite = valid === true ? bothTrue : null;
  const parts = [];
  parts.push(["issues", issues]);
  parts.push(["localWrite", localWrite]);
  parts.push(["sdkWritable", sdkEcho]);
  parts.push(["sdkWrite", sdkWrite]);
  parts.push(["usingCrazyGames", usingEcho]);
  parts.push(["valid", valid]);
  const ordered = Object.fromEntries(parts);
  return ordered;
}
export function checkSaveWriteBatch(requests) {
  const isArr = Array.isArray(requests) === true;
  const source = isArr === true ? requests : [];
  const results = [];
  for (const item of source) {
    const r = checkSaveWrite(item);
    results.push(r);
  }
  return results;
}
export function runFeature(payload) {
  const isPayloadObj = typeof payload === "object" && payload !== null && Array.isArray(payload) === false;
  if (isPayloadObj === false) {
    return { issues: ["bad-payload"], kind: "unknown", ok: false, value: null };
  }
  const kind = payload.kind;
  const isSingle = kind === "check-save-write";
  const isBatch = kind === "check-save-write-batch";
  const hasValidKind = isSingle === true || isBatch === true;
  if (hasValidKind === false) {
    return { issues: ["bad-kind"], kind: "unknown", ok: false, value: null };
  }
  const value = payload.value;
  if (isSingle === true) {
    const isValueObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
    if (isValueObj === false) {
      return { issues: ["bad-value"], kind: kind, ok: false, value: null };
    }
    const keys = [];
    for (const entry of Object.entries(value)) {
      const k = entry[0];
      keys.push(k);
    }
    const exact = keys.length === 2 && keys.includes("sdkWritable") === true && keys.includes("usingCrazyGames") === true;
    if (exact === false) {
      return { issues: ["bad-value"], kind: kind, ok: false, value: null };
    }
    const inner = checkSaveWrite(value);
    return { kind: kind, ok: true, value: inner };
  }
  const isValueObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
  if (isValueObj === false) {
    return { issues: ["bad-value"], kind: kind, ok: false, value: null };
  }
  const bkeys = [];
  for (const entry of Object.entries(value)) {
    const k = entry[0];
    bkeys.push(k);
  }
  const bexact = bkeys.length === 1 && bkeys.includes("requests") === true;
  if (bexact === false) {
    return { issues: ["bad-value"], kind: kind, ok: false, value: null };
  }
  const requests = value.requests;
  const isArr = Array.isArray(requests) === true;
  if (isArr === false) {
    return { issues: ["bad-requests"], kind: kind, ok: false, value: null };
  }
  const tooLong = requests.length > 16;
  if (tooLong === true) {
    return { issues: ["bad-requests"], kind: kind, ok: false, value: null };
  }
  const results = [];
  for (const item of requests) {
    const isItemObj = typeof item === "object" && item !== null && Array.isArray(item) === false;
    if (isItemObj === false) {
      return { issues: ["bad-requests"], kind: kind, ok: false, value: null };
    }
    const ikeys = [];
    for (const entry of Object.entries(item)) {
      const k = entry[0];
      ikeys.push(k);
    }
    const iexact = ikeys.length === 2 && ikeys.includes("sdkWritable") === true && ikeys.includes("usingCrazyGames") === true;
    if (iexact === false) {
      return { issues: ["bad-requests"], kind: kind, ok: false, value: null };
    }
    const r = checkSaveWrite(item);
    results.push(r);
  }
  return { kind: kind, ok: true, value: { results: results } };
}
