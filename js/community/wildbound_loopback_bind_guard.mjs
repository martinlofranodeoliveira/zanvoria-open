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
function isHostShape(host) {
  if (typeof host !== "string") {
    return false;
  }
  if (host.length < 1) {
    return false;
  }
  if (host.length > 64) {
    return false;
  }
  for (const ch of host) {
    if (ch !== "0" && ch !== "1" && ch !== "2" && ch !== "3" && ch !== "4" && ch !== "5" && ch !== "6" && ch !== "7" && ch !== "8" && ch !== "9" && ch !== ".") {
      return false;
    }
  }
  return true;
}
function isPortShape(port) {
  if (typeof port !== "number") {
    return false;
  }
  if (Number.isFinite(port) === false) {
    return false;
  }
  if (Number.isSafeInteger(port) === false) {
    return false;
  }
  if (Math.floor(port) !== port) {
    return false;
  }
  if (port < 0) {
    return false;
  }
  if (port > 65535) {
    return false;
  }
  return true;
}
function hasExactHostPortKeys(value) {
  if (isPlainObject(value) === false) {
    return false;
  }
  const entries = Object.entries(value);
  if (entries.length !== 2) {
    return false;
  }
  for (const [k] of Object.entries(value)) {
    if (k !== "host" && k !== "port") {
      return false;
    }
  }
  return true;
}
function hasExactRequestsKey(value) {
  if (isPlainObject(value) === false) {
    return false;
  }
  const entries = Object.entries(value);
  if (entries.length !== 1) {
    return false;
  }
  for (const [k] of Object.entries(value)) {
    if (k !== "requests") {
      return false;
    }
  }
  return true;
}
function hasValueKey(payload) {
  if (isPlainObject(payload) === false) {
    return false;
  }
  for (const [k] of Object.entries(payload)) {
    if (k === "value") {
      return true;
    }
  }
  return false;
}
export function checkLoopbackBind(value) {
  if (isPlainObject(value) === false) {
    const issuesFallback = [];
    issuesFallback.push("bad-host");
    issuesFallback.push("bad-port");
    const entriesFallback = [];
    entriesFallback.push(["allowed", false]);
    entriesFallback.push(["host", null]);
    entriesFallback.push(["issues", issuesFallback]);
    entriesFallback.push(["port", null]);
    entriesFallback.push(["reason", null]);
    entriesFallback.push(["valid", false]);
    return Object.fromEntries(entriesFallback);
  }
  const hostRaw = value.host;
  const portRaw = value.port;
  const hostOk = isHostShape(hostRaw);
  const portOk = isPortShape(portRaw);
  const issues = [];
  if (hostOk === false) {
    issues.push("bad-host");
  }
  if (portOk === false) {
    issues.push("bad-port");
  }
  const valid = hostOk && portOk;
  const hostEcho = typeof hostRaw === "string" ? hostRaw : null;
  const portEcho = typeof portRaw === "number" ? portRaw : null;
  const allowed = valid === true ? (hostRaw === "127.0.0.1" ? true : false) : false;
  const reason = valid === true ? (hostRaw === "127.0.0.1" ? null : "non-loopback-host") : null;
  const entries = [];
  entries.push(["allowed", allowed]);
  entries.push(["host", hostEcho]);
  entries.push(["issues", issues]);
  entries.push(["port", portEcho]);
  entries.push(["reason", reason]);
  entries.push(["valid", valid]);
  return Object.fromEntries(entries);
}
export function checkLoopbackBindBatch(batchValue) {
  if (isPlainObject(batchValue) === false) {
    const empty = [];
    const entriesEmpty = [];
    entriesEmpty.push(["results", empty]);
    return Object.fromEntries(entriesEmpty);
  }
  const requests = batchValue.requests;
  if (Array.isArray(requests) === false) {
    const emptyTwo = [];
    const entriesTwo = [];
    entriesTwo.push(["results", emptyTwo]);
    return Object.fromEntries(entriesTwo);
  }
  const results = [];
  for (const req of requests) {
    const r = checkLoopbackBind(req);
    results.push(r);
  }
  const outEntries = [];
  outEntries.push(["results", results]);
  return Object.fromEntries(outEntries);
}
export function runFeature(payload) {
  if (isPlainObject(payload) === false) {
    const issues = [];
    issues.push("bad-payload");
    const entries = [];
    entries.push(["issues", issues]);
    entries.push(["kind", "unknown"]);
    entries.push(["ok", false]);
    entries.push(["value", null]);
    return Object.fromEntries(entries);
  }
  const kind = payload.kind;
  if (kind !== "check-loopback-bind" && kind !== "check-loopback-bind-batch") {
    const issuesKind = [];
    issuesKind.push("bad-kind");
    const entriesKind = [];
    entriesKind.push(["issues", issuesKind]);
    entriesKind.push(["kind", "unknown"]);
    entriesKind.push(["ok", false]);
    entriesKind.push(["value", null]);
    return Object.fromEntries(entriesKind);
  }
  if (hasValueKey(payload) === false) {
    const issuesNoValue = [];
    issuesNoValue.push("bad-value");
    const entriesNoValue = [];
    entriesNoValue.push(["issues", issuesNoValue]);
    entriesNoValue.push(["kind", kind]);
    entriesNoValue.push(["ok", false]);
    entriesNoValue.push(["value", null]);
    return Object.fromEntries(entriesNoValue);
  }
  const value = payload.value;
  if (kind === "check-loopback-bind") {
    if (hasExactHostPortKeys(value) === false) {
      const issuesBadValue = [];
      issuesBadValue.push("bad-value");
      const entriesBadValue = [];
      entriesBadValue.push(["issues", issuesBadValue]);
      entriesBadValue.push(["kind", kind]);
      entriesBadValue.push(["ok", false]);
      entriesBadValue.push(["value", null]);
      return Object.fromEntries(entriesBadValue);
    }
    const inner = checkLoopbackBind(value);
    return {
      kind: kind,
      ok: true,
      value: inner
    };
  }
  if (hasExactRequestsKey(value) === false) {
    const issuesBadValueBatch = [];
    issuesBadValueBatch.push("bad-value");
    const entriesBadValueBatch = [];
    entriesBadValueBatch.push(["issues", issuesBadValueBatch]);
    entriesBadValueBatch.push(["kind", kind]);
    entriesBadValueBatch.push(["ok", false]);
    entriesBadValueBatch.push(["value", null]);
    return Object.fromEntries(entriesBadValueBatch);
  }
  const requests = value.requests;
  if (Array.isArray(requests) === false) {
    const issuesBadReq = [];
    issuesBadReq.push("bad-requests");
    const entriesBadReq = [];
    entriesBadReq.push(["issues", issuesBadReq]);
    entriesBadReq.push(["kind", kind]);
    entriesBadReq.push(["ok", false]);
    entriesBadReq.push(["value", null]);
    return Object.fromEntries(entriesBadReq);
  }
  if (requests.length > 16) {
    const issuesLong = [];
    issuesLong.push("bad-requests");
    const entriesLong = [];
    entriesLong.push(["issues", issuesLong]);
    entriesLong.push(["kind", kind]);
    entriesLong.push(["ok", false]);
    entriesLong.push(["value", null]);
    return Object.fromEntries(entriesLong);
  }
  const results = [];
  for (const req of requests) {
    if (hasExactHostPortKeys(req) === false) {
      const issuesElem = [];
      issuesElem.push("bad-requests");
      const entriesElem = [];
      entriesElem.push(["issues", issuesElem]);
      entriesElem.push(["kind", kind]);
      entriesElem.push(["ok", false]);
      entriesElem.push(["value", null]);
      return Object.fromEntries(entriesElem);
    }
    const evaluated = checkLoopbackBind(req);
    results.push(evaluated);
  }
  const batchInnerEntries = [];
  batchInnerEntries.push(["results", results]);
  const batchInner = Object.fromEntries(batchInnerEntries);
  return {
    kind: kind,
    ok: true,
    value: batchInner
  };
}
