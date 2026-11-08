export function runFeature(payload) {
  if (isPlainObject(payload) === false) {
    return { issues: ["bad-payload"], kind: "unknown", ok: false, value: null };
  }
  const kind = payload.kind;
  if (kind !== "check-preview-url" && kind !== "check-preview-url-batch") {
    return { issues: ["bad-kind"], kind: "unknown", ok: false, value: null };
  }
  if (kind === "check-preview-url") {
    const value = payload.value;
    if (hasExactPreviewKeys(value) === false) {
      return { issues: ["bad-value"], kind: "check-preview-url", ok: false, value: null };
    }
    const single = evaluatePreview(value);
    return { kind: "check-preview-url", ok: true, value: single };
  }
  const batchValue = payload.value;
  if (isBatchValue(batchValue) === false) {
    return { issues: ["bad-requests"], kind: "check-preview-url-batch", ok: false, value: null };
  }
  const results = [];
  for (const req of batchValue.requests) {
    const item = evaluatePreview(req);
    results.push(item);
  }
  const wrapped = Object.fromEntries([["results", results]]);
  return { kind: "check-preview-url-batch", ok: true, value: wrapped };
}
function isPlainObject(input) {
  if (typeof input !== "object") {
    return false;
  }
  if (input === null) {
    return false;
  }
  if (Array.isArray(input) === true) {
    return false;
  }
  return true;
}
function isProtocolString(input) {
  if (typeof input !== "string") {
    return false;
  }
  if (input.length < 1) {
    return false;
  }
  if (input.length > 16) {
    return false;
  }
  for (const ch of input) {
    if (ch < "a") {
      return false;
    }
    if (ch > "z") {
      return false;
    }
  }
  return true;
}
function isHostString(input) {
  if (typeof input !== "string") {
    return false;
  }
  if (input.length < 1) {
    return false;
  }
  if (input.length > 64) {
    return false;
  }
  for (const ch of input) {
    const isDot = ch === ".";
    const isDigit = ch >= "0" && ch <= "9";
    if (isDot === false && isDigit === false) {
      return false;
    }
  }
  return true;
}
function isPortNumber(input) {
  if (typeof input !== "number") {
    return false;
  }
  if (Number.isSafeInteger(input) === false) {
    return false;
  }
  if (input < -9007199254740991) {
    return false;
  }
  if (input > 9007199254740991) {
    return false;
  }
  return true;
}
function hasExactPreviewKeys(value) {
  if (isPlainObject(value) === false) {
    return false;
  }
  const entries = Object.entries(value);
  if (entries.length !== 3) {
    return false;
  }
  const keys = [];
  for (const entry of entries) {
    keys.push(entry[0]);
  }
  if (keys.includes("host") === false) {
    return false;
  }
  if (keys.includes("port") === false) {
    return false;
  }
  if (keys.includes("protocol") === false) {
    return false;
  }
  return true;
}
function isBatchValue(value) {
  if (isPlainObject(value) === false) {
    return false;
  }
  const entries = Object.entries(value);
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
  if (Array.isArray(value.requests) === false) {
    return false;
  }
  if (value.requests.length > 16) {
    return false;
  }
  return true;
}
function evaluatePreview(request) {
  const isObj = isPlainObject(request);
  const hostInput = isObj === true ? request.host : null;
  const portInput = isObj === true ? request.port : null;
  const protocolInput = isObj === true ? request.protocol : null;
  const hostOk = isHostString(hostInput);
  const portOk = isPortNumber(portInput);
  const protocolOk = isProtocolString(protocolInput);
  const issues = [];
  if (hostOk === false) {
    issues.push("bad-host");
  }
  if (portOk === false) {
    issues.push("bad-port");
  }
  if (protocolOk === false) {
    issues.push("bad-protocol");
  }
  const valid = hostOk === true && portOk === true && protocolOk === true;
  const hostEcho = typeof hostInput === "string" ? hostInput : null;
  const protocolEcho = typeof protocolInput === "string" ? protocolInput : null;
  const portEcho = typeof portInput === "number" ? portInput : null;
  const isHttp = protocolInput === "http";
  const isLoopback = hostInput === "127.0.0.1";
  const isPortAllowed = portInput >= 0 && portInput <= 65535;
  const allowedValue = valid === false ? false : isHttp === true && isLoopback === true && isPortAllowed === true;
  const blockedValue = valid === false ? null : allowedValue === true ? null : isHttp === false ? "non-http-protocol" : isLoopback === false ? "non-loopback-host" : "port-out-of-range";
  const urlValue = valid === false ? null : protocolInput + "://" + hostInput + ":" + String(portInput);
  const pairs = [];
  pairs.push(["allowed", allowedValue]);
  pairs.push(["blockedReason", blockedValue]);
  pairs.push(["host", hostEcho]);
  pairs.push(["issues", issues]);
  pairs.push(["port", portEcho]);
  pairs.push(["protocol", protocolEcho]);
  pairs.push(["url", urlValue]);
  pairs.push(["valid", valid]);
  const ordered = Object.fromEntries(pairs);
  return ordered;
}
