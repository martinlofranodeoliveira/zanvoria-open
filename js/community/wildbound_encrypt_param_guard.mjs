function isPlainObject(value) {
  if (typeof value !== "object") {
    return false;
  }
  if (value === null) {
    return false;
  }
  if (Array.isArray(value) === true) {
    return false;
  }
  return true;
}
function containsKey(keys, target) {
  for (const k of keys) {
    if (k === target) {
      return true;
    }
  }
  return false;
}
function hasExactEncryptKeys(value) {
  const entries = Object.entries(value);
  if (entries.length !== 3) {
    return false;
  }
  for (const [k] of entries) {
    if (k !== "algorithm" && k !== "ivLength" && k !== "keyFormat") {
      return false;
    }
  }
  const keys = Object.keys(value);
  if (containsKey(keys, "algorithm") === false) {
    return false;
  }
  if (containsKey(keys, "ivLength") === false) {
    return false;
  }
  if (containsKey(keys, "keyFormat") === false) {
    return false;
  }
  return true;
}
function hasExactRequestsKey(value) {
  const entries = Object.entries(value);
  if (entries.length !== 1) {
    return false;
  }
  for (const [k] of entries) {
    if (k !== "requests") {
      return false;
    }
  }
  const keys = Object.keys(value);
  if (containsKey(keys, "requests") === false) {
    return false;
  }
  return true;
}
function isAllowedAlgoChar(ch) {
  if (ch === "-") {
    return true;
  }
  if (ch === "A") {
    return true;
  }
  if (ch === "B") {
    return true;
  }
  if (ch === "C") {
    return true;
  }
  if (ch === "D") {
    return true;
  }
  if (ch === "E") {
    return true;
  }
  if (ch === "F") {
    return true;
  }
  if (ch === "G") {
    return true;
  }
  if (ch === "H") {
    return true;
  }
  if (ch === "I") {
    return true;
  }
  if (ch === "J") {
    return true;
  }
  if (ch === "K") {
    return true;
  }
  if (ch === "L") {
    return true;
  }
  if (ch === "M") {
    return true;
  }
  if (ch === "N") {
    return true;
  }
  if (ch === "O") {
    return true;
  }
  if (ch === "P") {
    return true;
  }
  if (ch === "Q") {
    return true;
  }
  if (ch === "R") {
    return true;
  }
  if (ch === "S") {
    return true;
  }
  if (ch === "T") {
    return true;
  }
  if (ch === "U") {
    return true;
  }
  if (ch === "V") {
    return true;
  }
  if (ch === "W") {
    return true;
  }
  if (ch === "X") {
    return true;
  }
  if (ch === "Y") {
    return true;
  }
  if (ch === "Z") {
    return true;
  }
  return false;
}
function isAllowedKeyChar(ch) {
  if (ch === "a") {
    return true;
  }
  if (ch === "b") {
    return true;
  }
  if (ch === "c") {
    return true;
  }
  if (ch === "d") {
    return true;
  }
  if (ch === "e") {
    return true;
  }
  if (ch === "f") {
    return true;
  }
  if (ch === "g") {
    return true;
  }
  if (ch === "h") {
    return true;
  }
  if (ch === "i") {
    return true;
  }
  if (ch === "j") {
    return true;
  }
  if (ch === "k") {
    return true;
  }
  if (ch === "l") {
    return true;
  }
  if (ch === "m") {
    return true;
  }
  if (ch === "n") {
    return true;
  }
  if (ch === "o") {
    return true;
  }
  if (ch === "p") {
    return true;
  }
  if (ch === "q") {
    return true;
  }
  if (ch === "r") {
    return true;
  }
  if (ch === "s") {
    return true;
  }
  if (ch === "t") {
    return true;
  }
  if (ch === "u") {
    return true;
  }
  if (ch === "v") {
    return true;
  }
  if (ch === "w") {
    return true;
  }
  if (ch === "x") {
    return true;
  }
  if (ch === "y") {
    return true;
  }
  if (ch === "z") {
    return true;
  }
  return false;
}
function isAlgorithmText(value) {
  if (typeof value !== "string") {
    return false;
  }
  if (value.length < 1) {
    return false;
  }
  if (value.length > 32) {
    return false;
  }
  for (const ch of value) {
    if (isAllowedAlgoChar(ch) === false) {
      return false;
    }
  }
  return true;
}
function isKeyFormatText(value) {
  if (typeof value !== "string") {
    return false;
  }
  if (value.length < 1) {
    return false;
  }
  if (value.length > 16) {
    return false;
  }
  for (const ch of value) {
    if (isAllowedKeyChar(ch) === false) {
      return false;
    }
  }
  return true;
}
function isIvLengthNumber(value) {
  if (typeof value !== "number") {
    return false;
  }
  if (Number.isFinite(value) === false) {
    return false;
  }
  if (Number.isSafeInteger(value) === false) {
    return false;
  }
  return true;
}
export function checkEncryptParam(value) {
  if (isPlainObject(value) === false) {
    const badIssues = [];
    badIssues.push("bad-algorithm");
    badIssues.push("bad-iv-length");
    badIssues.push("bad-key-format");
    const badResult = Object.fromEntries([
      ["algorithm", null],
      ["allowed", false],
      ["issues", badIssues],
      ["ivLength", null],
      ["keyFormat", null],
      ["reason", null],
      ["valid", false]
    ]);
    return badResult;
  }
  const algo = value.algorithm;
  const iv = value.ivLength;
  const fmt = value.keyFormat;
  const algoOk = isAlgorithmText(algo);
  const ivOk = isIvLengthNumber(iv);
  const fmtOk = isKeyFormatText(fmt);
  if (algoOk === true && ivOk === true && fmtOk === true) {
    if (algo === "AES-GCM" && iv === 12 && fmt === "raw") {
      const emptyIssues = [];
      const good = Object.fromEntries([
        ["algorithm", algo],
        ["allowed", true],
        ["issues", emptyIssues],
        ["ivLength", iv],
        ["keyFormat", fmt],
        ["reason", null],
        ["valid", true]
      ]);
      return good;
    }
    if (algo !== "AES-GCM") {
      const emptyA = [];
      const resA = Object.fromEntries([
        ["algorithm", algo],
        ["allowed", false],
        ["issues", emptyA],
        ["ivLength", iv],
        ["keyFormat", fmt],
        ["reason", "unsupported-algorithm"],
        ["valid", true]
      ]);
      return resA;
    }
    if (iv !== 12) {
      const emptyB = [];
      const resB = Object.fromEntries([
        ["algorithm", algo],
        ["allowed", false],
        ["issues", emptyB],
        ["ivLength", iv],
        ["keyFormat", fmt],
        ["reason", "bad-iv-length"],
        ["valid", true]
      ]);
      return resB;
    }
    const emptyC = [];
    const resC = Object.fromEntries([
      ["algorithm", algo],
      ["allowed", false],
      ["issues", emptyC],
      ["ivLength", iv],
      ["keyFormat", fmt],
      ["reason", "bad-key-format"],
      ["valid", true]
    ]);
    return resC;
  }
  const algoEcho = typeof algo === "string" ? algo : null;
  const ivEcho = typeof iv === "number" ? iv : null;
  const fmtEcho = typeof fmt === "string" ? fmt : null;
  const issues = [];
  if (algoOk === false) {
    issues.push("bad-algorithm");
  }
  if (ivOk === false) {
    issues.push("bad-iv-length");
  }
  if (fmtOk === false) {
    issues.push("bad-key-format");
  }
  const bad = Object.fromEntries([
    ["algorithm", algoEcho],
    ["allowed", false],
    ["issues", issues],
    ["ivLength", ivEcho],
    ["keyFormat", fmtEcho],
    ["reason", null],
    ["valid", false]
  ]);
  return bad;
}
export function checkEncryptParamBatch(requests) {
  const results = [];
  if (Array.isArray(requests) === false) {
    return results;
  }
  for (const req of requests) {
    const r = checkEncryptParam(req);
    results.push(r);
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
  if (kind !== "check-encrypt-param" && kind !== "check-encrypt-param-batch") {
    return {
      issues: ["bad-kind"],
      kind: "unknown",
      ok: false,
      value: null
    };
  }
  const topKeys = Object.keys(payload);
  if (containsKey(topKeys, "value") === false) {
    if (kind === "check-encrypt-param") {
      return {
        issues: ["bad-value"],
        kind: kind,
        ok: false,
        value: null
      };
    }
    return {
      issues: ["bad-requests"],
      kind: kind,
      ok: false,
      value: null
    };
  }
  const value = payload.value;
  if (kind === "check-encrypt-param") {
    if (isPlainObject(value) === false) {
      return {
        issues: ["bad-value"],
        kind: kind,
        ok: false,
        value: null
      };
    }
    if (hasExactEncryptKeys(value) === false) {
      return {
        issues: ["bad-value"],
        kind: kind,
        ok: false,
        value: null
      };
    }
    const result = checkEncryptParam(value);
    return {
      kind: kind,
      ok: true,
      value: result
    };
  }
  if (isPlainObject(value) === false) {
    return {
      issues: ["bad-requests"],
      kind: kind,
      ok: false,
      value: null
    };
  }
  if (hasExactRequestsKey(value) === false) {
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
    if (isPlainObject(req) === false) {
      return {
        issues: ["bad-requests"],
        kind: kind,
        ok: false,
        value: null
      };
    }
    if (hasExactEncryptKeys(req) === false) {
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
    const one = checkEncryptParam(req);
    results.push(one);
  }
  return {
    kind: kind,
    ok: true,
    value: {
      results: results
    }
  };
}
