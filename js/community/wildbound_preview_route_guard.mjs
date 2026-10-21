export function runFeature(payload) {
  const isPayloadObj = typeof payload === "object" && payload !== null && Array.isArray(payload) === false;
  if (isPayloadObj === false) {
    return { issues: ["bad-payload"], kind: "unknown", ok: false, value: null };
  }
  const seen = [];
  for (const entry of Object.entries(payload)) {
    const k = entry[0];
    seen.push(k);
  }
  const hasKind = seen.includes("kind");
  const hasValue = seen.includes("value");
  const kindVal = payload.kind;
  const valueVal = payload.value;
  const isCheckOne = kindVal === "check-preview-route";
  const isCheckBatch = kindVal === "check-preview-route-batch";
  const kindKnown = isCheckOne || isCheckBatch;
  if (hasKind === false || typeof kindVal !== "string" || kindKnown === false) {
    return { issues: ["bad-kind"], kind: "unknown", ok: false, value: null };
  }
  if (hasValue === false) {
    return { issues: ["bad-value"], kind: kindVal, ok: false, value: null };
  }
  if (isCheckOne === true) {
    const valueIsObj = typeof valueVal === "object" && valueVal !== null && Array.isArray(valueVal) === false;
    if (valueIsObj === false) {
      return { issues: ["bad-value"], kind: kindVal, ok: false, value: null };
    }
    const vKeys = Object.keys(valueVal);
    const vExact = vKeys.length === 4 && vKeys.includes("isSymlink") && vKeys.includes("method") && vKeys.includes("target") && vKeys.includes("traversesSymlink");
    const vSeen = [];
    for (const entry of Object.entries(valueVal)) {
      const kk = entry[0];
      vSeen.push(kk);
    }
    if (vExact === false || vSeen.length !== 4) {
      return { issues: ["bad-value"], kind: kindVal, ok: false, value: null };
    }
    const one = checkSingle(valueVal);
    return { kind: kindVal, ok: true, value: one };
  }
  const bIsObj = typeof valueVal === "object" && valueVal !== null && Array.isArray(valueVal) === false;
  if (bIsObj === false) {
    return { issues: ["bad-value"], kind: kindVal, ok: false, value: null };
  }
  const bKeys = Object.keys(valueVal);
  const bExact = bKeys.length === 1 && bKeys.includes("requests");
  const bSeen = [];
  for (const entry of Object.entries(valueVal)) {
    const bk = entry[0];
    bSeen.push(bk);
  }
  if (bExact === false || bSeen.length !== 1) {
    return { issues: ["bad-value"], kind: kindVal, ok: false, value: null };
  }
  const reqs = valueVal.requests;
  const reqsIsArray = Array.isArray(reqs);
  if (reqsIsArray === false) {
    return { issues: ["bad-requests"], kind: kindVal, ok: false, value: null };
  }
  const lenOk = reqs.length >= 0 && reqs.length <= 16;
  if (lenOk === false) {
    return { issues: ["bad-requests"], kind: kindVal, ok: false, value: null };
  }
  const badStruct = [];
  for (const r of reqs) {
    const rIsObj = typeof r === "object" && r !== null && Array.isArray(r) === false;
    if (rIsObj === false) {
      badStruct.push("bad");
    } else {
      const rk = Object.keys(r);
      const rok = rk.length === 4 && rk.includes("isSymlink") && rk.includes("method") && rk.includes("target") && rk.includes("traversesSymlink");
      if (rok === false) {
        badStruct.push("bad");
      }
    }
  }
  if (badStruct.length !== 0) {
    return { issues: ["bad-requests"], kind: kindVal, ok: false, value: null };
  }
  const results = [];
  for (const r of reqs) {
    const one = checkSingle(r);
    results.push(one);
  }
  return { kind: kindVal, ok: true, value: { results } };
}
function checkSingle(req) {
  const method = req.method;
  const target = req.target;
  const isSymlink = req.isSymlink;
  const traversesSymlink = req.traversesSymlink;
  const methodIsString = typeof method === "string";
  const targetIsString = typeof target === "string";
  const symlinkIsBool = typeof isSymlink === "boolean";
  const traversesIsBool = typeof traversesSymlink === "boolean";
  const methodLenOk = methodIsString === true ? (method.length >= 1 && method.length <= 8) : false;
  const targetLenOk = targetIsString === true ? (target.length >= 1 && target.length <= 128) : false;
  const targetStartOk = targetIsString === true ? (target[0] === "/") : false;
  const methodSrc = methodIsString === true ? method : "";
  const methodBad = [];
  for (const ch of methodSrc) {
    if (ch < "A" || ch > "Z") {
      methodBad.push(ch);
    }
  }
  const methodCharOk = methodBad.length === 0;
  const methodOk = methodIsString === true && methodLenOk === true && methodCharOk === true;
  const targetSrc = targetIsString === true ? target : "";
  const targetBad = [];
  for (const ch of targetSrc) {
    const isUpper = ch >= "A" && ch <= "Z";
    const isLower = ch >= "a" && ch <= "z";
    const isDigit = ch >= "0" && ch <= "9";
    const isSlash = ch === "/";
    const isDot = ch === ".";
    const isHyphen = ch === "-";
    const isUnder = ch === "_";
    const charOk = isUpper || isLower || isDigit || isSlash || isDot || isHyphen || isUnder;
    if (charOk === false) {
      targetBad.push(ch);
    }
  }
  const targetCharOk = targetBad.length === 0;
  const targetOk = targetIsString === true && targetLenOk === true && targetStartOk === true && targetCharOk === true;
  const issues = [];
  if (methodOk === false) {
    issues.push("bad-method");
  }
  if (targetOk === false) {
    issues.push("bad-target");
  }
  if (symlinkIsBool === false) {
    issues.push("bad-symlink-flag");
  }
  if (traversesIsBool === false) {
    issues.push("bad-traversal-flag");
  }
  const valid = issues.length === 0;
  if (valid === false) {
    const mEcho = methodIsString === true ? method : null;
    const tEcho = targetIsString === true ? target : null;
    const sEcho = symlinkIsBool === true ? isSymlink : null;
    const trEcho = traversesIsBool === true ? traversesSymlink : null;
    const badEntries = [];
    badEntries.push(["allowed", false]);
    badEntries.push(["blockedReason", null]);
    badEntries.push(["cache", null]);
    badEntries.push(["isSymlink", sEcho]);
    badEntries.push(["issues", issues]);
    badEntries.push(["method", mEcho]);
    badEntries.push(["status", null]);
    badEntries.push(["target", tEcho]);
    badEntries.push(["traversesSymlink", trEcho]);
    badEntries.push(["valid", false]);
    return Object.fromEntries(badEntries);
  }
  const isGet = method === "GET";
  const isHead = method === "HEAD";
  const methodAllowed = isGet || isHead;
  if (methodAllowed === false) {
    const mEntries = [];
    mEntries.push(["allowed", false]);
    mEntries.push(["blockedReason", "method-not-allowed"]);
    mEntries.push(["cache", null]);
    mEntries.push(["isSymlink", isSymlink]);
    mEntries.push(["issues", issues]);
    mEntries.push(["method", method]);
    mEntries.push(["status", 405]);
    mEntries.push(["target", target]);
    mEntries.push(["traversesSymlink", traversesSymlink]);
    mEntries.push(["valid", true]);
    return Object.fromEntries(mEntries);
  }
  const symlinkBlocked = isSymlink === true || traversesSymlink === true;
  if (symlinkBlocked === true) {
    const sEntries = [];
    sEntries.push(["allowed", false]);
    sEntries.push(["blockedReason", "symlink-denied"]);
    sEntries.push(["cache", null]);
    sEntries.push(["isSymlink", isSymlink]);
    sEntries.push(["issues", issues]);
    sEntries.push(["method", method]);
    sEntries.push(["status", 404]);
    sEntries.push(["target", target]);
    sEntries.push(["traversesSymlink", traversesSymlink]);
    sEntries.push(["valid", true]);
    return Object.fromEntries(sEntries);
  }
  const parts = target.split("/");
  const dotHits = [];
  const travHits = [];
  for (const seg of parts) {
    if (seg === "..") {
      travHits.push(seg);
    }
    const startsDot = seg[0] === ".";
    if (startsDot === true && seg !== "..") {
      dotHits.push(seg);
    }
  }
  const hasDot = dotHits.length !== 0;
  if (hasDot === true) {
    const dEntries = [];
    dEntries.push(["allowed", false]);
    dEntries.push(["blockedReason", "dotfile-denied"]);
    dEntries.push(["cache", null]);
    dEntries.push(["isSymlink", isSymlink]);
    dEntries.push(["issues", issues]);
    dEntries.push(["method", method]);
    dEntries.push(["status", 404]);
    dEntries.push(["target", target]);
    dEntries.push(["traversesSymlink", traversesSymlink]);
    dEntries.push(["valid", true]);
    return Object.fromEntries(dEntries);
  }
  const hasTrav = travHits.length !== 0;
  if (hasTrav === true) {
    const tEntries = [];
    tEntries.push(["allowed", false]);
    tEntries.push(["blockedReason", "traversal-denied"]);
    tEntries.push(["cache", null]);
    tEntries.push(["isSymlink", isSymlink]);
    tEntries.push(["issues", issues]);
    tEntries.push(["method", method]);
    tEntries.push(["status", 404]);
    tEntries.push(["target", target]);
    tEntries.push(["traversesSymlink", traversesSymlink]);
    tEntries.push(["valid", true]);
    return Object.fromEntries(tEntries);
  }
  const isRoot = target === "/";
  const isIndex = target === "/index.html";
  const isJs = target.startsWith("/js/");
  const isCss = target.startsWith("/css/");
  const pathAllowed = isRoot || isIndex || isJs || isCss;
  if (pathAllowed === false) {
    const nEntries = [];
    nEntries.push(["allowed", false]);
    nEntries.push(["blockedReason", "not-found"]);
    nEntries.push(["cache", null]);
    nEntries.push(["isSymlink", isSymlink]);
    nEntries.push(["issues", issues]);
    nEntries.push(["method", method]);
    nEntries.push(["status", 404]);
    nEntries.push(["target", target]);
    nEntries.push(["traversesSymlink", traversesSymlink]);
    nEntries.push(["valid", true]);
    return Object.fromEntries(nEntries);
  }
  const okEntries = [];
  okEntries.push(["allowed", true]);
  okEntries.push(["blockedReason", null]);
  okEntries.push(["cache", "no-store"]);
  okEntries.push(["isSymlink", isSymlink]);
  okEntries.push(["issues", issues]);
  okEntries.push(["method", method]);
  okEntries.push(["status", 200]);
  okEntries.push(["target", target]);
  okEntries.push(["traversesSymlink", traversesSymlink]);
  okEntries.push(["valid", true]);
  return Object.fromEntries(okEntries);
}
