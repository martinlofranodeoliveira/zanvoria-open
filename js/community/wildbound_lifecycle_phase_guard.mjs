function isPlainObject(v) {
  if (typeof v !== "object") {
    return false;
  }
  if (v === null) {
    return false;
  }
  if (Array.isArray(v)) {
    return false;
  }
  return true;
}
function hasExactlyEvent(value) {
  if (isPlainObject(value) === false) {
    return false;
  }
  const entries = Object.entries(value);
  if (entries.length !== 1) {
    return false;
  }
  for (const entry of entries) {
    const k = entry[0];
    if (k !== "event") {
      return false;
    }
  }
  return true;
}
function hasExactlyRequests(value) {
  if (isPlainObject(value) === false) {
    return false;
  }
  const entries = Object.entries(value);
  if (entries.length !== 1) {
    return false;
  }
  for (const entry of entries) {
    const k = entry[0];
    if (k !== "requests") {
      return false;
    }
  }
  return true;
}
function isValidEventString(event) {
  if (typeof event !== "string") {
    return false;
  }
  if (event.length < 1) {
    return false;
  }
  if (event.length > 32) {
    return false;
  }
  for (const ch of event) {
    const upper = ch >= "A" && ch <= "Z";
    const lower = ch >= "a" && ch <= "z";
    if (upper === false) {
      if (lower === false) {
        return false;
      }
    }
  }
  return true;
}
function buildSingle(value) {
  const raw = value.event;
  const echo = typeof raw === "string" ? raw : null;
  if (isValidEventString(raw) === false) {
    const issuesBad = [];
    issuesBad.push("bad-event");
    const entriesBad = [];
    entriesBad.push(["allowed", false]);
    entriesBad.push(["event", echo]);
    entriesBad.push(["issues", issuesBad]);
    entriesBad.push(["phase", null]);
    entriesBad.push(["reason", null]);
    entriesBad.push(["valid", false]);
    return Object.fromEntries(entriesBad);
  }
  if (raw === "loadingStart") {
    const issuesA = [];
    const entriesA = [];
    entriesA.push(["allowed", true]);
    entriesA.push(["event", echo]);
    entriesA.push(["issues", issuesA]);
    entriesA.push(["phase", "loading"]);
    entriesA.push(["reason", null]);
    entriesA.push(["valid", true]);
    return Object.fromEntries(entriesA);
  }
  if (raw === "loadingStop") {
    const issuesB = [];
    const entriesB = [];
    entriesB.push(["allowed", true]);
    entriesB.push(["event", echo]);
    entriesB.push(["issues", issuesB]);
    entriesB.push(["phase", "loading"]);
    entriesB.push(["reason", null]);
    entriesB.push(["valid", true]);
    return Object.fromEntries(entriesB);
  }
  if (raw === "gameplayStart") {
    const issuesC = [];
    const entriesC = [];
    entriesC.push(["allowed", true]);
    entriesC.push(["event", echo]);
    entriesC.push(["issues", issuesC]);
    entriesC.push(["phase", "gameplay"]);
    entriesC.push(["reason", null]);
    entriesC.push(["valid", true]);
    return Object.fromEntries(entriesC);
  }
  if (raw === "gameplayStop") {
    const issuesD = [];
    const entriesD = [];
    entriesD.push(["allowed", true]);
    entriesD.push(["event", echo]);
    entriesD.push(["issues", issuesD]);
    entriesD.push(["phase", "gameplay"]);
    entriesD.push(["reason", null]);
    entriesD.push(["valid", true]);
    return Object.fromEntries(entriesD);
  }
  const issuesE = [];
  const entriesE = [];
  entriesE.push(["allowed", false]);
  entriesE.push(["event", echo]);
  entriesE.push(["issues", issuesE]);
  entriesE.push(["phase", null]);
  entriesE.push(["reason", "unlisted-event"]);
  entriesE.push(["valid", true]);
  return Object.fromEntries(entriesE);
}
export function checkLifecyclePhase(value) {
  if (typeof value === "string") {
    const tmp = { event: value };
    return buildSingle(tmp);
  }
  if (hasExactlyEvent(value) === false) {
    const issuesH = [];
    issuesH.push("bad-event");
    const entriesH = [];
    entriesH.push(["allowed", false]);
    entriesH.push(["event", null]);
    entriesH.push(["issues", issuesH]);
    entriesH.push(["phase", null]);
    entriesH.push(["reason", null]);
    entriesH.push(["valid", false]);
    return Object.fromEntries(entriesH);
  }
  return buildSingle(value);
}
export function checkLifecyclePhaseBatch(value) {
  const target = hasExactlyRequests(value) ? value.requests : value;
  if (Array.isArray(target) === false) {
    const emptyA = [];
    return emptyA;
  }
  if (target.length > 16) {
    const emptyB = [];
    return emptyB;
  }
  for (const itemA of target) {
    if (hasExactlyEvent(itemA) === false) {
      const emptyC = [];
      return emptyC;
    }
  }
  const results = [];
  for (const itemB of target) {
    const one = buildSingle(itemB);
    results.push(one);
  }
  return results;
}
export function runFeature(payload) {
  if (isPlainObject(payload) === false) {
    const issuesPayload = [];
    issuesPayload.push("bad-payload");
    const entriesPayload = [];
    entriesPayload.push(["issues", issuesPayload]);
    entriesPayload.push(["kind", "unknown"]);
    entriesPayload.push(["ok", false]);
    entriesPayload.push(["value", null]);
    return Object.fromEntries(entriesPayload);
  }
  const kind = payload.kind;
  if (kind !== "check-lifecycle-phase" && kind !== "check-lifecycle-phase-batch") {
    const issuesKind = [];
    issuesKind.push("bad-kind");
    const entriesKind = [];
    entriesKind.push(["issues", issuesKind]);
    entriesKind.push(["kind", "unknown"]);
    entriesKind.push(["ok", false]);
    entriesKind.push(["value", null]);
    return Object.fromEntries(entriesKind);
  }
  if (kind === "check-lifecycle-phase") {
    const singleValue = payload.value;
    if (hasExactlyEvent(singleValue) === false) {
      const issuesValue = [];
      issuesValue.push("bad-value");
      const entriesValue = [];
      entriesValue.push(["issues", issuesValue]);
      entriesValue.push(["kind", "check-lifecycle-phase"]);
      entriesValue.push(["ok", false]);
      entriesValue.push(["value", null]);
      return Object.fromEntries(entriesValue);
    }
    const singleResult = buildSingle(singleValue);
    const entriesSingle = [];
    entriesSingle.push(["kind", "check-lifecycle-phase"]);
    entriesSingle.push(["ok", true]);
    entriesSingle.push(["value", singleResult]);
    return Object.fromEntries(entriesSingle);
  }
  const batchValue = payload.value;
  if (hasExactlyRequests(batchValue) === false) {
    const issuesBatchValue = [];
    issuesBatchValue.push("bad-value");
    const entriesBatchValue = [];
    entriesBatchValue.push(["issues", issuesBatchValue]);
    entriesBatchValue.push(["kind", "check-lifecycle-phase-batch"]);
    entriesBatchValue.push(["ok", false]);
    entriesBatchValue.push(["value", null]);
    return Object.fromEntries(entriesBatchValue);
  }
  const reqs = batchValue.requests;
  if (Array.isArray(reqs) === false) {
    const issuesReqType = [];
    issuesReqType.push("bad-requests");
    const entriesReqType = [];
    entriesReqType.push(["issues", issuesReqType]);
    entriesReqType.push(["kind", "check-lifecycle-phase-batch"]);
    entriesReqType.push(["ok", false]);
    entriesReqType.push(["value", null]);
    return Object.fromEntries(entriesReqType);
  }
  if (reqs.length > 16) {
    const issuesReqLen = [];
    issuesReqLen.push("bad-requests");
    const entriesReqLen = [];
    entriesReqLen.push(["issues", issuesReqLen]);
    entriesReqLen.push(["kind", "check-lifecycle-phase-batch"]);
    entriesReqLen.push(["ok", false]);
    entriesReqLen.push(["value", null]);
    return Object.fromEntries(entriesReqLen);
  }
  for (const reqCheck of reqs) {
    if (hasExactlyEvent(reqCheck) === false) {
      const issuesReqItem = [];
      issuesReqItem.push("bad-requests");
      const entriesReqItem = [];
      entriesReqItem.push(["issues", issuesReqItem]);
      entriesReqItem.push(["kind", "check-lifecycle-phase-batch"]);
      entriesReqItem.push(["ok", false]);
      entriesReqItem.push(["value", null]);
      return Object.fromEntries(entriesReqItem);
    }
  }
  const results = [];
  for (const reqItem of reqs) {
    const one = buildSingle(reqItem);
    results.push(one);
  }
  const valueEntries = [];
  valueEntries.push(["results", results]);
  const valueObj = Object.fromEntries(valueEntries);
  const entriesBatch = [];
  entriesBatch.push(["kind", "check-lifecycle-phase-batch"]);
  entriesBatch.push(["ok", true]);
  entriesBatch.push(["value", valueObj]);
  return Object.fromEntries(entriesBatch);
}
