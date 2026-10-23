export function runFeature(payload) {
  const isPayloadObj = typeof payload === "object" && payload !== null && Array.isArray(payload) === false;
  if (isPayloadObj === false) {
    return { issues: ["bad-payload"], kind: "unknown", ok: false, value: null };
  }
  const kindValue = payload.kind;
  const isSingleKind = kindValue === "check-ad-enable";
  const isBatchKind = kindValue === "check-ad-enable-batch";
  const isKnownKind = isSingleKind === true || isBatchKind === true;
  if (isKnownKind === false) {
    return { issues: ["bad-kind"], kind: "unknown", ok: false, value: null };
  }
  if (isSingleKind === true) {
    const singleValue = payload.value;
    const isSingleObj = typeof singleValue === "object" && singleValue !== null && Array.isArray(singleValue) === false;
    if (isSingleObj === false) {
      const badValueEntries = [];
      badValueEntries.push(["issues", ["bad-value"]]);
      badValueEntries.push(["kind", "check-ad-enable"]);
      badValueEntries.push(["ok", false]);
      badValueEntries.push(["value", null]);
      return Object.fromEntries(badValueEntries);
    }
    const singleExtra = [];
    for (const entry of Object.entries(singleValue)) {
      const key = entry[0];
      const isWanted = key === "adsEnabled" || key === "hasAdApi";
      if (isWanted === false) {
        singleExtra.push(key);
      }
    }
    const singleLen = Object.entries(singleValue).length;
    const singleShapeBad = singleExtra.length !== 0 || singleLen !== 2;
    if (singleShapeBad === true) {
      const badShapeEntries = [];
      badShapeEntries.push(["issues", ["bad-value"]]);
      badShapeEntries.push(["kind", "check-ad-enable"]);
      badShapeEntries.push(["ok", false]);
      badShapeEntries.push(["value", null]);
      return Object.fromEntries(badShapeEntries);
    }
    const adsOk = typeof singleValue.adsEnabled === "boolean";
    const apiOk = typeof singleValue.hasAdApi === "boolean";
    const adsEcho = typeof singleValue.adsEnabled === "boolean" ? singleValue.adsEnabled : null;
    const apiEcho = typeof singleValue.hasAdApi === "boolean" ? singleValue.hasAdApi : null;
    const singleIssues = [];
    if (adsOk === false) {
      singleIssues.push("bad-ads-enabled");
    }
    if (apiOk === false) {
      singleIssues.push("bad-ad-api");
    }
    const singleValid = adsOk === true && apiOk === true;
    const singleAllowed = singleValid === true && singleValue.adsEnabled === true && singleValue.hasAdApi === true;
    const singleAttempted = singleAllowed === true;
    const singleReasonWhenValid = singleAllowed === true ? null : (singleValue.adsEnabled === false ? "ads-disabled" : "ad-api-unavailable");
    const singleReason = singleValid === true ? singleReasonWhenValid : null;
    const singleInnerEntries = [];
    singleInnerEntries.push(["adsEnabled", adsEcho]);
    singleInnerEntries.push(["allowed", singleAllowed]);
    singleInnerEntries.push(["attempted", singleAttempted]);
    singleInnerEntries.push(["hasAdApi", apiEcho]);
    singleInnerEntries.push(["issues", singleIssues]);
    singleInnerEntries.push(["reason", singleReason]);
    singleInnerEntries.push(["valid", singleValid]);
    const singleInner = Object.fromEntries(singleInnerEntries);
    const singleOuterEntries = [];
    singleOuterEntries.push(["kind", "check-ad-enable"]);
    singleOuterEntries.push(["ok", true]);
    singleOuterEntries.push(["value", singleInner]);
    return Object.fromEntries(singleOuterEntries);
  }
  const batchValue = payload.value;
  const isBatchObj = typeof batchValue === "object" && batchValue !== null && Array.isArray(batchValue) === false;
  if (isBatchObj === false) {
    const badReqEntriesA = [];
    badReqEntriesA.push(["issues", ["bad-requests"]]);
    badReqEntriesA.push(["kind", "check-ad-enable-batch"]);
    badReqEntriesA.push(["ok", false]);
    badReqEntriesA.push(["value", null]);
    return Object.fromEntries(badReqEntriesA);
  }
  const batchExtra = [];
  for (const entry of Object.entries(batchValue)) {
    const key = entry[0];
    const isWanted = key === "requests";
    if (isWanted === false) {
      batchExtra.push(key);
    }
  }
  const batchLen = Object.entries(batchValue).length;
  const batchShapeBad = batchExtra.length !== 0 || batchLen !== 1;
  if (batchShapeBad === true) {
    const badReqEntriesB = [];
    badReqEntriesB.push(["issues", ["bad-requests"]]);
    badReqEntriesB.push(["kind", "check-ad-enable-batch"]);
    badReqEntriesB.push(["ok", false]);
    badReqEntriesB.push(["value", null]);
    return Object.fromEntries(badReqEntriesB);
  }
  const requests = batchValue.requests;
  const isRequestsArray = Array.isArray(requests);
  if (isRequestsArray === false) {
    const badReqEntriesC = [];
    badReqEntriesC.push(["issues", ["bad-requests"]]);
    badReqEntriesC.push(["kind", "check-ad-enable-batch"]);
    badReqEntriesC.push(["ok", false]);
    badReqEntriesC.push(["value", null]);
    return Object.fromEntries(badReqEntriesC);
  }
  const reqLen = requests.length;
  const lenOk = reqLen >= 0 && reqLen <= 16;
  if (lenOk === false) {
    const badReqEntriesD = [];
    badReqEntriesD.push(["issues", ["bad-requests"]]);
    badReqEntriesD.push(["kind", "check-ad-enable-batch"]);
    badReqEntriesD.push(["ok", false]);
    badReqEntriesD.push(["value", null]);
    return Object.fromEntries(badReqEntriesD);
  }
  const batchProblems = [];
  for (const item of requests) {
    const isItemObj = typeof item === "object" && item !== null && Array.isArray(item) === false;
    if (isItemObj === false) {
      batchProblems.push("bad");
    } else {
      const itemExtra = [];
      for (const entry of Object.entries(item)) {
        const key = entry[0];
        const isWanted = key === "adsEnabled" || key === "hasAdApi";
        if (isWanted === false) {
          itemExtra.push(key);
        }
      }
      const itemLen = Object.entries(item).length;
      const itemShapeBad = itemExtra.length !== 0 || itemLen !== 2;
      if (itemShapeBad === true) {
        batchProblems.push("bad");
      }
    }
  }
  const hasBatchProblems = batchProblems.length !== 0;
  if (hasBatchProblems === true) {
    const badReqEntriesE = [];
    badReqEntriesE.push(["issues", ["bad-requests"]]);
    badReqEntriesE.push(["kind", "check-ad-enable-batch"]);
    badReqEntriesE.push(["ok", false]);
    badReqEntriesE.push(["value", null]);
    return Object.fromEntries(badReqEntriesE);
  }
  const results = [];
  for (const item of requests) {
    const adsOk = typeof item.adsEnabled === "boolean";
    const apiOk = typeof item.hasAdApi === "boolean";
    const adsEcho = typeof item.adsEnabled === "boolean" ? item.adsEnabled : null;
    const apiEcho = typeof item.hasAdApi === "boolean" ? item.hasAdApi : null;
    const itemIssues = [];
    if (adsOk === false) {
      itemIssues.push("bad-ads-enabled");
    }
    if (apiOk === false) {
      itemIssues.push("bad-ad-api");
    }
    const itemValid = adsOk === true && apiOk === true;
    const itemAllowed = itemValid === true && item.adsEnabled === true && item.hasAdApi === true;
    const itemAttempted = itemAllowed === true;
    const itemReasonWhenValid = itemAllowed === true ? null : (item.adsEnabled === false ? "ads-disabled" : "ad-api-unavailable");
    const itemReason = itemValid === true ? itemReasonWhenValid : null;
    const itemEntries = [];
    itemEntries.push(["adsEnabled", adsEcho]);
    itemEntries.push(["allowed", itemAllowed]);
    itemEntries.push(["attempted", itemAttempted]);
    itemEntries.push(["hasAdApi", apiEcho]);
    itemEntries.push(["issues", itemIssues]);
    itemEntries.push(["reason", itemReason]);
    itemEntries.push(["valid", itemValid]);
    const orderedItem = Object.fromEntries(itemEntries);
    results.push(orderedItem);
  }
  const batchInnerEntries = [];
  batchInnerEntries.push(["results", results]);
  const batchInner = Object.fromEntries(batchInnerEntries);
  const batchOuterEntries = [];
  batchOuterEntries.push(["kind", "check-ad-enable-batch"]);
  batchOuterEntries.push(["ok", true]);
  batchOuterEntries.push(["value", batchInner]);
  return Object.fromEntries(batchOuterEntries);
}
