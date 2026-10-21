export function runFeature(payload) {
  const isPayloadObject = typeof payload === "object" && payload !== null && Array.isArray(payload) === false;
  if (isPayloadObject === false) {
    return { issues: ["bad-payload"], kind: "unknown", ok: false, value: null };
  }
  const kindHolders = [];
  const valueHolders = [];
  const keyHolders = [];
  for (const entry of Object.entries(payload)) {
    const entryKey = entry[0];
    const entryValue = entry[1];
    if (entryKey === "kind") {
      kindHolders.push(entryValue);
    }
    if (entryKey === "value") {
      valueHolders.push(entryValue);
    }
    keyHolders.push(entryKey);
  }
  if (kindHolders.length !== 1) {
    return { issues: ["bad-kind"], kind: "unknown", ok: false, value: null };
  }
  const kindValue = kindHolders[0];
  if (kindValue !== "check-node-engine" && kindValue !== "check-node-engine-batch") {
    return { issues: ["bad-kind"], kind: "unknown", ok: false, value: null };
  }
  if (keyHolders.length !== 2) {
    const badPayloadPairs = [];
    badPayloadPairs.push(["issues", ["bad-payload"]]);
    badPayloadPairs.push(["kind", kindValue]);
    badPayloadPairs.push(["ok", false]);
    badPayloadPairs.push(["value", null]);
    return Object.fromEntries(badPayloadPairs);
  }
  if (valueHolders.length !== 1) {
    const badPayloadPairs2 = [];
    badPayloadPairs2.push(["issues", ["bad-payload"]]);
    badPayloadPairs2.push(["kind", kindValue]);
    badPayloadPairs2.push(["ok", false]);
    badPayloadPairs2.push(["value", null]);
    return Object.fromEntries(badPayloadPairs2);
  }
  if (kindValue === "check-node-engine") {
    const singleValue = valueHolders[0];
    const isSingleObject = typeof singleValue === "object" && singleValue !== null && Array.isArray(singleValue) === false;
    if (isSingleObject === false) {
      const badValuePairs = [];
      badValuePairs.push(["issues", ["bad-value"]]);
      badValuePairs.push(["kind", kindValue]);
      badValuePairs.push(["ok", false]);
      badValuePairs.push(["value", null]);
      return Object.fromEntries(badValuePairs);
    }
    const singleKeys = [];
    const singleMajors = [];
    for (const singleEntry of Object.entries(singleValue)) {
      const singleKey = singleEntry[0];
      const singleVal = singleEntry[1];
      if (singleKey === "major") {
        singleMajors.push(singleVal);
      }
      singleKeys.push(singleKey);
    }
    if (singleKeys.length !== 1) {
      const badValuePairs2 = [];
      badValuePairs2.push(["issues", ["bad-value"]]);
      badValuePairs2.push(["kind", kindValue]);
      badValuePairs2.push(["ok", false]);
      badValuePairs2.push(["value", null]);
      return Object.fromEntries(badValuePairs2);
    }
    if (singleMajors.length !== 1) {
      const badValuePairs3 = [];
      badValuePairs3.push(["issues", ["bad-value"]]);
      badValuePairs3.push(["kind", kindValue]);
      badValuePairs3.push(["ok", false]);
      badValuePairs3.push(["value", null]);
      return Object.fromEntries(badValuePairs3);
    }
    const majorInput = singleMajors[0];
    const isNum = typeof majorInput === "number";
    const isFin = Number.isFinite(majorInput);
    const isSafe = Number.isSafeInteger(majorInput);
    const floored = Math.floor(majorInput);
    const floorMatches = floored === majorInput;
    const inRange = majorInput >= 0 && majorInput <= 1000;
    const validMajor = isNum && isFin && isSafe && floorMatches && inRange;
    if (validMajor === true) {
      const isSupported = majorInput >= 22;
      if (isSupported === true) {
        const okPairs = [];
        okPairs.push(["issues", []]);
        okPairs.push(["major", majorInput]);
        okPairs.push(["reason", null]);
        okPairs.push(["supported", true]);
        okPairs.push(["valid", true]);
        const innerOk = Object.fromEntries(okPairs);
        const outerOk = [];
        outerOk.push(["kind", kindValue]);
        outerOk.push(["ok", true]);
        outerOk.push(["value", innerOk]);
        return Object.fromEntries(outerOk);
      }
      if (isSupported === false) {
        const oldPairs = [];
        oldPairs.push(["issues", []]);
        oldPairs.push(["major", majorInput]);
        oldPairs.push(["reason", "engine-too-old"]);
        oldPairs.push(["supported", false]);
        oldPairs.push(["valid", true]);
        const innerOld = Object.fromEntries(oldPairs);
        const outerOld = [];
        outerOld.push(["kind", kindValue]);
        outerOld.push(["ok", true]);
        outerOld.push(["value", innerOld]);
        return Object.fromEntries(outerOld);
      }
    }
    if (validMajor === false) {
      if (isNum === true) {
        const badMajorPairs = [];
        badMajorPairs.push(["issues", ["bad-major"]]);
        badMajorPairs.push(["major", majorInput]);
        badMajorPairs.push(["reason", null]);
        badMajorPairs.push(["supported", false]);
        badMajorPairs.push(["valid", false]);
        const innerBad = Object.fromEntries(badMajorPairs);
        const outerBad = [];
        outerBad.push(["kind", kindValue]);
        outerBad.push(["ok", true]);
        outerBad.push(["value", innerBad]);
        return Object.fromEntries(outerBad);
      }
      if (isNum === false) {
        const badMajorPairs2 = [];
        badMajorPairs2.push(["issues", ["bad-major"]]);
        badMajorPairs2.push(["major", null]);
        badMajorPairs2.push(["reason", null]);
        badMajorPairs2.push(["supported", false]);
        badMajorPairs2.push(["valid", false]);
        const innerBad2 = Object.fromEntries(badMajorPairs2);
        const outerBad2 = [];
        outerBad2.push(["kind", kindValue]);
        outerBad2.push(["ok", true]);
        outerBad2.push(["value", innerBad2]);
        return Object.fromEntries(outerBad2);
      }
    }
  }
  if (kindValue === "check-node-engine-batch") {
    const batchValue = valueHolders[0];
    const isBatchObject = typeof batchValue === "object" && batchValue !== null && Array.isArray(batchValue) === false;
    if (isBatchObject === false) {
      const bvPairs = [];
      bvPairs.push(["issues", ["bad-value"]]);
      bvPairs.push(["kind", kindValue]);
      bvPairs.push(["ok", false]);
      bvPairs.push(["value", null]);
      return Object.fromEntries(bvPairs);
    }
    const batchKeys = [];
    const batchReqHolders = [];
    for (const batchEntry of Object.entries(batchValue)) {
      const batchKey = batchEntry[0];
      const batchVal = batchEntry[1];
      if (batchKey === "requests") {
        batchReqHolders.push(batchVal);
      }
      batchKeys.push(batchKey);
    }
    if (batchKeys.length !== 1) {
      const bvPairs2 = [];
      bvPairs2.push(["issues", ["bad-value"]]);
      bvPairs2.push(["kind", kindValue]);
      bvPairs2.push(["ok", false]);
      bvPairs2.push(["value", null]);
      return Object.fromEntries(bvPairs2);
    }
    if (batchReqHolders.length !== 1) {
      const bvPairs3 = [];
      bvPairs3.push(["issues", ["bad-value"]]);
      bvPairs3.push(["kind", kindValue]);
      bvPairs3.push(["ok", false]);
      bvPairs3.push(["value", null]);
      return Object.fromEntries(bvPairs3);
    }
    const requestsVal = batchReqHolders[0];
    const isRequestsArray = Array.isArray(requestsVal);
    if (isRequestsArray === false) {
      const brPairs = [];
      brPairs.push(["issues", ["bad-requests"]]);
      brPairs.push(["kind", kindValue]);
      brPairs.push(["ok", false]);
      brPairs.push(["value", null]);
      return Object.fromEntries(brPairs);
    }
    const reqLen = requestsVal.length;
    if (reqLen > 16) {
      const brPairs2 = [];
      brPairs2.push(["issues", ["bad-requests"]]);
      brPairs2.push(["kind", kindValue]);
      brPairs2.push(["ok", false]);
      brPairs2.push(["value", null]);
      return Object.fromEntries(brPairs2);
    }
    const shapeBad = [];
    for (const req of requestsVal) {
      const isReqObj = typeof req === "object" && req !== null && Array.isArray(req) === false;
      if (isReqObj === false) {
        shapeBad.push("bad");
      } else {
        const reqKeys = [];
        const reqMajors = [];
        for (const reqEntry of Object.entries(req)) {
          const reqKey = reqEntry[0];
          const reqVal = reqEntry[1];
          if (reqKey === "major") {
            reqMajors.push(reqVal);
          }
          reqKeys.push(reqKey);
        }
        if (reqKeys.length !== 1) {
          shapeBad.push("bad");
        } else {
          if (reqMajors.length !== 1) {
            shapeBad.push("bad");
          }
        }
      }
    }
    if (shapeBad.length !== 0) {
      const brPairs3 = [];
      brPairs3.push(["issues", ["bad-requests"]]);
      brPairs3.push(["kind", kindValue]);
      brPairs3.push(["ok", false]);
      brPairs3.push(["value", null]);
      return Object.fromEntries(brPairs3);
    }
    const resultsList = [];
    for (const reqItem of requestsVal) {
      const tmpMajors = [];
      for (const tmpEntry of Object.entries(reqItem)) {
        const tmpK = tmpEntry[0];
        const tmpV = tmpEntry[1];
        if (tmpK === "major") {
          tmpMajors.push(tmpV);
        }
      }
      const curMajor = tmpMajors[0];
      const curIsNum = typeof curMajor === "number";
      const curIsFin = Number.isFinite(curMajor);
      const curIsSafe = Number.isSafeInteger(curMajor);
      const curFloored = Math.floor(curMajor);
      const curFloorOk = curFloored === curMajor;
      const curInRange = curMajor >= 0 && curMajor <= 1000;
      const curValid = curIsNum && curIsFin && curIsSafe && curFloorOk && curInRange;
      if (curValid === true) {
        const curSupported = curMajor >= 22;
        if (curSupported === true) {
          const rp = [];
          rp.push(["issues", []]);
          rp.push(["major", curMajor]);
          rp.push(["reason", null]);
          rp.push(["supported", true]);
          rp.push(["valid", true]);
          const robj = Object.fromEntries(rp);
          resultsList.push(robj);
        }
        if (curSupported === false) {
          const rp2 = [];
          rp2.push(["issues", []]);
          rp2.push(["major", curMajor]);
          rp2.push(["reason", "engine-too-old"]);
          rp2.push(["supported", false]);
          rp2.push(["valid", true]);
          const robj2 = Object.fromEntries(rp2);
          resultsList.push(robj2);
        }
      }
      if (curValid === false) {
        if (curIsNum === true) {
          const rp3 = [];
          rp3.push(["issues", ["bad-major"]]);
          rp3.push(["major", curMajor]);
          rp3.push(["reason", null]);
          rp3.push(["supported", false]);
          rp3.push(["valid", false]);
          const robj3 = Object.fromEntries(rp3);
          resultsList.push(robj3);
        }
        if (curIsNum === false) {
          const rp4 = [];
          rp4.push(["issues", ["bad-major"]]);
          rp4.push(["major", null]);
          rp4.push(["reason", null]);
          rp4.push(["supported", false]);
          rp4.push(["valid", false]);
          const robj4 = Object.fromEntries(rp4);
          resultsList.push(robj4);
        }
      }
    }
    const batchInnerPairs = [];
    batchInnerPairs.push(["results", resultsList]);
    const batchInner = Object.fromEntries(batchInnerPairs);
    const batchOuterPairs = [];
    batchOuterPairs.push(["kind", kindValue]);
    batchOuterPairs.push(["ok", true]);
    batchOuterPairs.push(["value", batchInner]);
    return Object.fromEntries(batchOuterPairs);
  }
  const fallbackPairs = [];
  fallbackPairs.push(["issues", ["bad-kind"]]);
  fallbackPairs.push(["kind", "unknown"]);
  fallbackPairs.push(["ok", false]);
  fallbackPairs.push(["value", null]);
  return Object.fromEntries(fallbackPairs);
}
