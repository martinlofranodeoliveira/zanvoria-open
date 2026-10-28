function isPlainObject(candidate) {
  const isObj = typeof candidate === "object";
  const notNull = candidate !== null;
  const notArray = Array.isArray(candidate) === false;
  const result = isObj && notNull && notArray;
  return result;
}
function hasPayloadShape(candidate) {
  const kindHits = [];
  const valueHits = [];
  const otherHits = [];
  for (const entry of Object.entries(candidate)) {
    const key = entry[0];
    if (key === "kind") {
      kindHits.push(key);
    }
    if (key === "value") {
      valueHits.push(key);
    }
    if (key !== "kind" && key !== "value") {
      otherHits.push(key);
    }
  }
  const kindOk = kindHits.length === 1;
  const valueOk = valueHits.length === 1;
  const otherOk = otherHits.length === 0;
  const shapeOk = kindOk && valueOk && otherOk;
  return shapeOk;
}
function hasSurfaceShape(candidate) {
  const objOk = isPlainObject(candidate);
  if (objOk === false) {
    return false;
  }
  const adHits = [];
  const dataHits = [];
  const gameHits = [];
  const initHits = [];
  const userHits = [];
  const otherHits = [];
  for (const entry of Object.entries(candidate)) {
    const key = entry[0];
    if (key === "ad") {
      adHits.push(key);
    }
    if (key === "data") {
      dataHits.push(key);
    }
    if (key === "game") {
      gameHits.push(key);
    }
    if (key === "init") {
      initHits.push(key);
    }
    if (key === "user") {
      userHits.push(key);
    }
    if (key !== "ad" && key !== "data" && key !== "game" && key !== "init" && key !== "user") {
      otherHits.push(key);
    }
  }
  const adOk = adHits.length === 1;
  const dataOk = dataHits.length === 1;
  const gameOk = gameHits.length === 1;
  const initOk = initHits.length === 1;
  const userOk = userHits.length === 1;
  const otherOk = otherHits.length === 0;
  const shapeOk = adOk && dataOk && gameOk && initOk && userOk && otherOk;
  return shapeOk;
}
function hasBatchShape(candidate) {
  const reqHits = [];
  const otherHits = [];
  for (const entry of Object.entries(candidate)) {
    const key = entry[0];
    if (key === "requests") {
      reqHits.push(key);
    }
    if (key !== "requests") {
      otherHits.push(key);
    }
  }
  const reqOk = reqHits.length === 1;
  const otherOk = otherHits.length === 0;
  const shapeOk = reqOk && otherOk;
  return shapeOk;
}
function evaluateSurface(surface) {
  const seen = [];
  for (const entry of Object.entries(surface)) {
    const ek = entry[0];
    seen.push(ek);
  }
  const seenOk = seen.length >= 0;
  const adFlag = surface.ad;
  const dataFlag = surface.data;
  const gameFlag = surface.game;
  const initFlag = surface.init;
  const userFlag = surface.user;
  const adIsBool = typeof adFlag === "boolean";
  const dataIsBool = typeof dataFlag === "boolean";
  const gameIsBool = typeof gameFlag === "boolean";
  const initIsBool = typeof initFlag === "boolean";
  const userIsBool = typeof userFlag === "boolean";
  const baseValid = adIsBool && dataIsBool && gameIsBool && initIsBool && userIsBool;
  const valid = baseValid && seenOk;
  const issues = [];
  if (adIsBool === false) {
    issues.push("bad-ad-flag");
  }
  if (dataIsBool === false) {
    issues.push("bad-data-flag");
  }
  if (gameIsBool === false) {
    issues.push("bad-game-flag");
  }
  if (initIsBool === false) {
    issues.push("bad-init-flag");
  }
  if (userIsBool === false) {
    issues.push("bad-user-flag");
  }
  const adOut = adIsBool ? adFlag : null;
  const dataOut = dataIsBool ? dataFlag : null;
  const gameOut = gameIsBool ? gameFlag : null;
  const initOut = initIsBool ? initFlag : null;
  const userOut = userIsBool ? userFlag : null;
  const lifecycle = initFlag && gameFlag;
  const persist = initFlag && dataFlag;
  const advertise = initFlag && adFlag;
  const rank = initFlag && userFlag;
  const canLifecycleOut = valid ? lifecycle : null;
  const canPersistOut = valid ? persist : null;
  const canAdvertiseOut = valid ? advertise : null;
  const canRankOut = valid ? rank : null;
  const ordered = [];
  ordered.push(["ad", adOut]);
  ordered.push(["canAdvertise", canAdvertiseOut]);
  ordered.push(["canLifecycle", canLifecycleOut]);
  ordered.push(["canPersist", canPersistOut]);
  ordered.push(["canRank", canRankOut]);
  ordered.push(["data", dataOut]);
  ordered.push(["game", gameOut]);
  ordered.push(["init", initOut]);
  ordered.push(["issues", issues]);
  ordered.push(["user", userOut]);
  ordered.push(["valid", valid]);
  const out = Object.fromEntries(ordered);
  return out;
}
export function checkSdkSurface(surface) {
  const shapeOk = hasSurfaceShape(surface);
  if (shapeOk === false) {
    return null;
  }
  const result = evaluateSurface(surface);
  return result;
}
export function checkSdkSurfaceBatch(batchValue) {
  const objOk = isPlainObject(batchValue);
  if (objOk === false) {
    return null;
  }
  const shapeOk = hasBatchShape(batchValue);
  if (shapeOk === false) {
    return null;
  }
  const requests = batchValue.requests;
  const isArr = Array.isArray(requests);
  if (isArr === false) {
    return null;
  }
  const lowerOk = requests.length >= 0;
  const upperOk = requests.length <= 16;
  const lenOk = lowerOk && upperOk;
  if (lenOk === false) {
    return null;
  }
  const bad = [];
  for (const item of requests) {
    const s = hasSurfaceShape(item);
    if (s === false) {
      bad.push(item);
    }
  }
  const hasBad = bad.length !== 0;
  if (hasBad) {
    return null;
  }
  const results = [];
  for (const item of requests) {
    const ev = evaluateSurface(item);
    results.push(ev);
  }
  const outer = [];
  outer.push(["results", results]);
  const out = Object.fromEntries(outer);
  return out;
}
export function runFeature(payload) {
  const payloadIsObj = isPlainObject(payload);
  if (payloadIsObj === false) {
    const issues = [];
    issues.push("bad-payload");
    const entries = [];
    entries.push(["issues", issues]);
    entries.push(["kind", "unknown"]);
    entries.push(["ok", false]);
    entries.push(["value", null]);
    const out = Object.fromEntries(entries);
    return out;
  }
  const shapeOk = hasPayloadShape(payload);
  const rawKind = payload.kind;
  const rawValue = payload.value;
  const isSingle = rawKind === "check-sdk-surface";
  const isBatch = rawKind === "check-sdk-surface-batch";
  const kindValid = isSingle || isBatch;
  if (shapeOk === false) {
    if (kindValid === false) {
      const issuesA = [];
      issuesA.push("bad-kind");
      const entriesA = [];
      entriesA.push(["issues", issuesA]);
      entriesA.push(["kind", "unknown"]);
      entriesA.push(["ok", false]);
      entriesA.push(["value", null]);
      const outA = Object.fromEntries(entriesA);
      return outA;
    }
    const issuesB = [];
    issuesB.push("bad-payload");
    const entriesB = [];
    entriesB.push(["issues", issuesB]);
    entriesB.push(["kind", rawKind]);
    entriesB.push(["ok", false]);
    entriesB.push(["value", null]);
    const outB = Object.fromEntries(entriesB);
    return outB;
  }
  if (kindValid === false) {
    const issuesC = [];
    issuesC.push("bad-kind");
    const entriesC = [];
    entriesC.push(["issues", issuesC]);
    entriesC.push(["kind", "unknown"]);
    entriesC.push(["ok", false]);
    entriesC.push(["value", null]);
    const outC = Object.fromEntries(entriesC);
    return outC;
  }
  if (isSingle) {
    const surfOk = hasSurfaceShape(rawValue);
    if (surfOk === false) {
      const issuesD = [];
      issuesD.push("bad-value");
      const entriesD = [];
      entriesD.push(["issues", issuesD]);
      entriesD.push(["kind", rawKind]);
      entriesD.push(["ok", false]);
      entriesD.push(["value", null]);
      const outD = Object.fromEntries(entriesD);
      return outD;
    }
    const singleResult = evaluateSurface(rawValue);
    const sEntries = [];
    sEntries.push(["kind", rawKind]);
    sEntries.push(["ok", true]);
    sEntries.push(["value", singleResult]);
    const sOut = Object.fromEntries(sEntries);
    return sOut;
  }
  const batchObjOk = isPlainObject(rawValue);
  if (batchObjOk === false) {
    const issuesE = [];
    issuesE.push("bad-requests");
    const entriesE = [];
    entriesE.push(["issues", issuesE]);
    entriesE.push(["kind", rawKind]);
    entriesE.push(["ok", false]);
    entriesE.push(["value", null]);
    const outE = Object.fromEntries(entriesE);
    return outE;
  }
  const batchShapeOk = hasBatchShape(rawValue);
  if (batchShapeOk === false) {
    const issuesF = [];
    issuesF.push("bad-requests");
    const entriesF = [];
    entriesF.push(["issues", issuesF]);
    entriesF.push(["kind", rawKind]);
    entriesF.push(["ok", false]);
    entriesF.push(["value", null]);
    const outF = Object.fromEntries(entriesF);
    return outF;
  }
  const requests = rawValue.requests;
  const isArr = Array.isArray(requests);
  if (isArr === false) {
    const issuesG = [];
    issuesG.push("bad-requests");
    const entriesG = [];
    entriesG.push(["issues", issuesG]);
    entriesG.push(["kind", rawKind]);
    entriesG.push(["ok", false]);
    entriesG.push(["value", null]);
    const outG = Object.fromEntries(entriesG);
    return outG;
  }
  const lowerOk = requests.length >= 0;
  const upperOk = requests.length <= 16;
  const lenOk = lowerOk && upperOk;
  if (lenOk === false) {
    const issuesH = [];
    issuesH.push("bad-requests");
    const entriesH = [];
    entriesH.push(["issues", issuesH]);
    entriesH.push(["kind", rawKind]);
    entriesH.push(["ok", false]);
    entriesH.push(["value", null]);
    const outH = Object.fromEntries(entriesH);
    return outH;
  }
  const badItems = [];
  for (const item of requests) {
    const okItem = hasSurfaceShape(item);
    if (okItem === false) {
      badItems.push(item);
    }
  }
  const hasBad = badItems.length !== 0;
  if (hasBad) {
    const issuesI = [];
    issuesI.push("bad-requests");
    const entriesI = [];
    entriesI.push(["issues", issuesI]);
    entriesI.push(["kind", rawKind]);
    entriesI.push(["ok", false]);
    entriesI.push(["value", null]);
    const outI = Object.fromEntries(entriesI);
    return outI;
  }
  const results = [];
  for (const item of requests) {
    const ev = evaluateSurface(item);
    results.push(ev);
  }
  const innerEntries = [];
  innerEntries.push(["results", results]);
  const innerValue = Object.fromEntries(innerEntries);
  const bEntries = [];
  bEntries.push(["kind", rawKind]);
  bEntries.push(["ok", true]);
  bEntries.push(["value", innerValue]);
  const bOut = Object.fromEntries(bEntries);
  return bOut;
}
