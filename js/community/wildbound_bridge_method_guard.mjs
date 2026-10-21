function isPlainObject(value) {
  if (typeof value !== "object") {
    return false;
  }
  if (value === null) {
    return false;
  }
  if (Array.isArray(value)) {
    return false;
  }
  return true;
}
function isLetter(ch) {
  if (ch >= "A") {
    if (ch <= "Z") {
      return true;
    }
  }
  if (ch >= "a") {
    if (ch <= "z") {
      return true;
    }
  }
  return false;
}
function isLettersOnly(text) {
  for (const ch of text) {
    if (isLetter(ch) === false) {
      return false;
    }
  }
  return true;
}
function isAllowedMethod(method) {
  const allowed = [];
  allowed.push("init");
  allowed.push("loadingStart");
  allowed.push("loadingStop");
  allowed.push("gameplayStart");
  allowed.push("gameplayStop");
  allowed.push("getSave");
  allowed.push("setSave");
  allowed.push("getSettings");
  allowed.push("setSettings");
  allowed.push("requestAd");
  allowed.push("onMuteChange");
  allowed.push("submitScore");
  allowed.push("isCrazyGames");
  for (const candidate of allowed) {
    if (method === candidate) {
      return true;
    }
  }
  return false;
}
function hasPayloadShape(payload) {
  const seenKind = [];
  const seenValue = [];
  const seenOther = [];
  for (const [k] of Object.entries(payload)) {
    if (k === "kind") {
      seenKind.push(k);
    } else if (k === "value") {
      seenValue.push(k);
    } else {
      seenOther.push(k);
    }
  }
  if (seenKind.length === 1) {
    if (seenValue.length === 1) {
      if (seenOther.length === 0) {
        return true;
      }
    }
  }
  return false;
}
function hasSingleShape(value) {
  const seenMethod = [];
  const seenOther = [];
  for (const [k] of Object.entries(value)) {
    if (k === "method") {
      seenMethod.push(k);
    } else {
      seenOther.push(k);
    }
  }
  if (seenMethod.length === 1) {
    if (seenOther.length === 0) {
      return true;
    }
  }
  return false;
}
function hasBatchShape(value) {
  const seenRequests = [];
  const seenOther = [];
  for (const [k] of Object.entries(value)) {
    if (k === "requests") {
      seenRequests.push(k);
    } else {
      seenOther.push(k);
    }
  }
  if (seenRequests.length === 1) {
    if (seenOther.length === 0) {
      return true;
    }
  }
  return false;
}
function isValidMethodString(method) {
  if (typeof method !== "string") {
    return false;
  }
  if (method.length < 1) {
    return false;
  }
  if (method.length > 32) {
    return false;
  }
  if (isLettersOnly(method) === false) {
    return false;
  }
  return true;
}
function buildMethodResult(allowed, issues, method, reason, valid) {
  const entries = [];
  entries.push(["allowed", allowed]);
  entries.push(["issues", issues]);
  entries.push(["method", method]);
  entries.push(["reason", reason]);
  entries.push(["valid", valid]);
  return Object.fromEntries(entries);
}
export function checkBridgeMethod(request) {
  if (isPlainObject(request) === false) {
    const badIssues = [];
    badIssues.push("bad-method");
    return buildMethodResult(false, badIssues, null, null, false);
  }
  if (hasSingleShape(request) === false) {
    const { method: echoOne } = request;
    if (typeof echoOne === "string") {
      const echoIssues = [];
      echoIssues.push("bad-method");
      return buildMethodResult(false, echoIssues, echoOne, null, false);
    }
    const nullIssues = [];
    nullIssues.push("bad-method");
    return buildMethodResult(false, nullIssues, null, null, false);
  }
  const { method } = request;
  if (isValidMethodString(method) === false) {
    if (typeof method === "string") {
      const malformedIssues = [];
      malformedIssues.push("bad-method");
      return buildMethodResult(false, malformedIssues, method, null, false);
    }
    const nonStringIssues = [];
    nonStringIssues.push("bad-method");
    return buildMethodResult(false, nonStringIssues, null, null, false);
  }
  if (isAllowedMethod(method) === true) {
    const emptyIssues = [];
    return buildMethodResult(true, emptyIssues, method, null, true);
  }
  const cleanIssues = [];
  return buildMethodResult(false, cleanIssues, method, "unlisted-method", true);
}
export function checkBridgeMethodBatch(batch) {
  if (isPlainObject(batch) === false) {
    const empty = [];
    return { results: empty };
  }
  if (hasBatchShape(batch) === false) {
    const emptyTwo = [];
    return { results: emptyTwo };
  }
  const { requests } = batch;
  if (Array.isArray(requests) === false) {
    const emptyThree = [];
    return { results: emptyThree };
  }
  const results = [];
  for (const item of requests) {
    const one = checkBridgeMethod(item);
    results.push(one);
  }
  return { results };
}
export function runFeature(payload) {
  if (isPlainObject(payload) === false) {
    const payloadIssues = [];
    payloadIssues.push("bad-payload");
    return { issues: payloadIssues, kind: "unknown", ok: false, value: null };
  }
  if (hasPayloadShape(payload) === false) {
    const { kind: shapeKind } = payload;
    if (shapeKind === "check-bridge-method") {
      const shapeIssuesOne = [];
      shapeIssuesOne.push("bad-payload");
      return { issues: shapeIssuesOne, kind: shapeKind, ok: false, value: null };
    }
    if (shapeKind === "check-bridge-method-batch") {
      const shapeIssuesTwo = [];
      shapeIssuesTwo.push("bad-payload");
      return { issues: shapeIssuesTwo, kind: shapeKind, ok: false, value: null };
    }
    const shapeIssuesOther = [];
    shapeIssuesOther.push("bad-payload");
    return { issues: shapeIssuesOther, kind: "unknown", ok: false, value: null };
  }
  const { kind, value } = payload;
  if (kind === "check-bridge-method") {
    if (isPlainObject(value) === false) {
      const valueIssues = [];
      valueIssues.push("bad-value");
      return { issues: valueIssues, kind, ok: false, value: null };
    }
    if (hasSingleShape(value) === false) {
      const singleIssues = [];
      singleIssues.push("bad-value");
      return { issues: singleIssues, kind, ok: false, value: null };
    }
    const singleResult = checkBridgeMethod(value);
    return { kind, ok: true, value: singleResult };
  }
  if (kind === "check-bridge-method-batch") {
    if (isPlainObject(value) === false) {
      const batchIssues = [];
      batchIssues.push("bad-value");
      return { issues: batchIssues, kind, ok: false, value: null };
    }
    if (hasBatchShape(value) === false) {
      const shapeIssues = [];
      shapeIssues.push("bad-value");
      return { issues: shapeIssues, kind, ok: false, value: null };
    }
    const { requests } = value;
    if (Array.isArray(requests) === false) {
      const reqIssues = [];
      reqIssues.push("bad-requests");
      return { issues: reqIssues, kind, ok: false, value: null };
    }
    if (requests.length > 16) {
      const lenIssues = [];
      lenIssues.push("bad-requests");
      return { issues: lenIssues, kind, ok: false, value: null };
    }
    const batchValue = checkBridgeMethodBatch(value);
    return { kind, ok: true, value: batchValue };
  }
  const kindIssues = [];
  kindIssues.push("bad-kind");
  return { issues: kindIssues, kind: "unknown", ok: false, value: null };
}
