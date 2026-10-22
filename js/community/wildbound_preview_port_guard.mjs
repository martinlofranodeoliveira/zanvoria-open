export function runFeature(payload) {
  if (typeof payload !== "object") {
    return {
      issues: ["bad-payload"],
      kind: "unknown",
      ok: false,
      value: null
    };
  }
  if (payload === null) {
    return {
      issues: ["bad-payload"],
      kind: "unknown",
      ok: false,
      value: null
    };
  }
  if (Array.isArray(payload) === true) {
    return {
      issues: ["bad-payload"],
      kind: "unknown",
      ok: false,
      value: null
    };
  }
  const kind = payload.kind;
  const value = payload.value;
  for (const entry of Object.entries(payload)) {
    if (entry[0] === "kind") {
      if (entry[1] !== kind) {
        return {
          issues: ["bad-payload"],
          kind: "unknown",
          ok: false,
          value: null
        };
      }
    }
  }
  if (kind !== "check-preview-port" && kind !== "check-preview-port-batch") {
    return {
      issues: ["bad-kind"],
      kind: "unknown",
      ok: false,
      value: null
    };
  }
  if (kind === "check-preview-port") {
    if (isSingleValue(value) === false) {
      return {
        issues: ["bad-value"],
        kind: kind,
        ok: false,
        value: null
      };
    }
    const port = value.port;
    const inner = evaluatePort(port);
    return Object.fromEntries([
      ["kind", kind],
      ["ok", true],
      ["value", inner]
    ]);
  }
  if (isBatchValue(value) === false) {
    return {
      issues: ["bad-requests"],
      kind: kind,
      ok: false,
      value: null
    };
  }
  const requests = value.requests;
  if (Array.isArray(requests) === false) {
    return {
      issues: ["bad-requests"],
      kind: kind,
      ok: false,
      value: null
    };
  }
  if (requests.length > 16) {
    return {
      issues: ["bad-requests"],
      kind: kind,
      ok: false,
      value: null
    };
  }
  for (const req of requests) {
    if (isSingleValue(req) === false) {
      return {
        issues: ["bad-requests"],
        kind: kind,
        ok: false,
        value: null
      };
    }
  }
  const results = [];
  for (const req of requests) {
    const p = req.port;
    const r = evaluatePort(p);
    results.push(r);
  }
  const innerValue = Object.fromEntries([
    ["results", results]
  ]);
  return Object.fromEntries([
    ["kind", kind],
    ["ok", true],
    ["value", innerValue]
  ]);
}
function isSingleValue(v) {
  if (typeof v !== "object") {
    return false;
  }
  if (v === null) {
    return false;
  }
  if (Array.isArray(v) === true) {
    return false;
  }
  if (Object.entries(v).length !== 1) {
    return false;
  }
  for (const entry of Object.entries(v)) {
    if (entry[0] !== "port") {
      return false;
    }
  }
  return true;
}
function isBatchValue(v) {
  if (typeof v !== "object") {
    return false;
  }
  if (v === null) {
    return false;
  }
  if (Array.isArray(v) === true) {
    return false;
  }
  if (Object.entries(v).length !== 1) {
    return false;
  }
  for (const entry of Object.entries(v)) {
    if (entry[0] !== "requests") {
      return false;
    }
  }
  return true;
}
function evaluatePort(port) {
  if (Number.isSafeInteger(port) === false) {
    if (typeof port === "number") {
      if (Number.isFinite(port) === true) {
        if (port <= 9007199254740991) {
          if (port >= -9007199254740991) {
            return Object.fromEntries([
              ["allowed", false],
              ["effective", null],
              ["issues", ["bad-port"]],
              ["port", port],
              ["reason", null],
              ["valid", false]
            ]);
          }
        }
      }
    }
    return Object.fromEntries([
      ["allowed", false],
      ["effective", null],
      ["issues", ["bad-port"]],
      ["port", null],
      ["reason", null],
      ["valid", false]
    ]);
  }
  if (port >= 0) {
    if (port <= 65535) {
      if (port === 0) {
        return Object.fromEntries([
          ["allowed", true],
          ["effective", port],
          ["issues", []],
          ["port", port],
          ["reason", "ephemeral-port"],
          ["valid", true]
        ]);
      }
      if (port === 8080) {
        return Object.fromEntries([
          ["allowed", true],
          ["effective", port],
          ["issues", []],
          ["port", port],
          ["reason", "default-port"],
          ["valid", true]
        ]);
      }
      return Object.fromEntries([
        ["allowed", true],
        ["effective", port],
        ["issues", []],
        ["port", port],
        ["reason", "custom-port"],
        ["valid", true]
      ]);
    }
  }
  return Object.fromEntries([
    ["allowed", false],
    ["effective", null],
    ["issues", []],
    ["port", port],
    ["reason", "invalid-port"],
    ["valid", true]
  ]);
}
