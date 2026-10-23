export function checkNoticeSeparation(value) {
  const flagExcluded = value.advertisesExcludedNoRedistribution;
  const flagHistory = value.advertisesHistorySeparate;
  const flagNotice = value.advertisesNoticeReference;
  const flagPrivate = value.advertisesPrivatePreserved;
  const isExcludedBool = typeof flagExcluded === "boolean";
  const isHistoryBool = typeof flagHistory === "boolean";
  const isNoticeBool = typeof flagNotice === "boolean";
  const isPrivateBool = typeof flagPrivate === "boolean";
  const allBool = isExcludedBool === true && isHistoryBool === true && isNoticeBool === true && isPrivateBool === true;
  const allTrue = flagExcluded === true && flagHistory === true && flagNotice === true && flagPrivate === true;
  const valid = allBool;
  const complete = allBool === true && allTrue === true;
  const outExcluded = isExcludedBool === true ? flagExcluded : null;
  const outHistory = isHistoryBool === true ? flagHistory : null;
  const outNotice = isNoticeBool === true ? flagNotice : null;
  const outPrivate = isPrivateBool === true ? flagPrivate : null;
  const issues = [];
  if (allBool === true) {
    if (flagExcluded === false) {
      issues.push("missing-excluded-no-redistribution");
    }
    if (flagHistory === false) {
      issues.push("missing-history-separate");
    }
    if (flagNotice === false) {
      issues.push("missing-notice-reference");
    }
    if (flagPrivate === false) {
      issues.push("missing-private-preserved");
    }
  }
  if (allBool === false) {
    if (isExcludedBool === false) {
      issues.push("bad-excluded-no-redistribution");
    }
    if (isHistoryBool === false) {
      issues.push("bad-history-separate");
    }
    if (isNoticeBool === false) {
      issues.push("bad-notice-reference");
    }
    if (isPrivateBool === false) {
      issues.push("bad-private-preserved");
    }
  }
  const pairs = [];
  pairs.push(["advertisesExcludedNoRedistribution", outExcluded]);
  pairs.push(["advertisesHistorySeparate", outHistory]);
  pairs.push(["advertisesNoticeReference", outNotice]);
  pairs.push(["advertisesPrivatePreserved", outPrivate]);
  pairs.push(["complete", complete]);
  pairs.push(["issues", issues]);
  pairs.push(["valid", valid]);
  const ordered = Object.fromEntries(pairs);
  return ordered;
}
export function checkNoticeSeparationBatch(input) {
  if (Array.isArray(input) === true) {
    const results = [];
    for (const req of input) {
      const one = checkNoticeSeparation(req);
      results.push(one);
    }
    const pairs = [];
    pairs.push(["results", results]);
    const ordered = Object.fromEntries(pairs);
    return ordered;
  }
  const isObj = typeof input === "object" && input !== null && Array.isArray(input) === false;
  if (isObj === true) {
    const reqs = input.requests;
    if (Array.isArray(reqs) === true) {
      const results = [];
      for (const req of reqs) {
        const one = checkNoticeSeparation(req);
        results.push(one);
      }
      const pairs = [];
      pairs.push(["results", results]);
      const ordered = Object.fromEntries(pairs);
      return ordered;
    }
  }
  const fallbackResults = [];
  const fallbackPairs = [];
  fallbackPairs.push(["results", fallbackResults]);
  const fallback = Object.fromEntries(fallbackPairs);
  return fallback;
}
export function runFeature(payload) {
  const isPayloadObj = typeof payload === "object" && payload !== null && Array.isArray(payload) === false;
  if (isPayloadObj === false) {
    const issues = [];
    issues.push("bad-payload");
    const ordered = {
      issues: issues,
      kind: "unknown",
      ok: false,
      value: null
    };
    return ordered;
  }
  const kind = payload.kind;
  const value = payload.value;
  const isSingle = kind === "check-notice-separation";
  const isBatch = kind === "check-notice-separation-batch";
  if (isSingle === false && isBatch === false) {
    const issues = [];
    issues.push("bad-kind");
    const ordered = {
      issues: issues,
      kind: "unknown",
      ok: false,
      value: null
    };
    return ordered;
  }
  if (isSingle === true) {
    const isSingleValueObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
    if (isSingleValueObj === false) {
      const issues = [];
      issues.push("bad-value");
      const ordered = {
        issues: issues,
        kind: kind,
        ok: false,
        value: null
      };
      return ordered;
    }
    const countOk = Object.entries(value).length === 4;
    const badKeys = [];
    for (const entry of Object.entries(value)) {
      const k = entry[0];
      if (k !== "advertisesExcludedNoRedistribution" && k !== "advertisesHistorySeparate" && k !== "advertisesNoticeReference" && k !== "advertisesPrivatePreserved") {
        badKeys.push(k);
      }
    }
    const hasBadKeys = badKeys.length !== 0;
    if (countOk === false || hasBadKeys === true) {
      const issues = [];
      issues.push("bad-value");
      const ordered = {
        issues: issues,
        kind: kind,
        ok: false,
        value: null
      };
      return ordered;
    }
    const result = checkNoticeSeparation(value);
    const topOrdered = {
      kind: kind,
      ok: true,
      value: result
    };
    return topOrdered;
  }
  const isBatchValueObj = typeof value === "object" && value !== null && Array.isArray(value) === false;
  if (isBatchValueObj === false) {
    const issues = [];
    issues.push("bad-requests");
    const ordered = {
      issues: issues,
      kind: kind,
      ok: false,
      value: null
    };
    return ordered;
  }
  const batchCountOk = Object.entries(value).length === 1;
  const batchBadKeys = [];
  for (const entry of Object.entries(value)) {
    const k = entry[0];
    if (k !== "requests") {
      batchBadKeys.push(k);
    }
  }
  const hasBatchBadKeys = batchBadKeys.length !== 0;
  if (batchCountOk === false || hasBatchBadKeys === true) {
    const issues = [];
    issues.push("bad-requests");
    const ordered = {
      issues: issues,
      kind: kind,
      ok: false,
      value: null
    };
    return ordered;
  }
  const requests = value.requests;
  if (Array.isArray(requests) === false) {
    const issues = [];
    issues.push("bad-requests");
    const ordered = {
      issues: issues,
      kind: kind,
      ok: false,
      value: null
    };
    return ordered;
  }
  const lenOk = requests.length >= 0 && requests.length <= 16;
  if (lenOk === false) {
    const issues = [];
    issues.push("bad-requests");
    const ordered = {
      issues: issues,
      kind: kind,
      ok: false,
      value: null
    };
    return ordered;
  }
  const invalid = [];
  for (const req of requests) {
    const isReqObj = typeof req === "object" && req !== null && Array.isArray(req) === false;
    if (isReqObj === false) {
      invalid.push(req);
    } else {
      const reqCountOk = Object.entries(req).length === 4;
      if (reqCountOk === false) {
        invalid.push(req);
      } else {
        const reqBad = [];
        for (const rEntry of Object.entries(req)) {
          const rk = rEntry[0];
          if (rk !== "advertisesExcludedNoRedistribution" && rk !== "advertisesHistorySeparate" && rk !== "advertisesNoticeReference" && rk !== "advertisesPrivatePreserved") {
            reqBad.push(rk);
          }
        }
        if (reqBad.length !== 0) {
          invalid.push(req);
        }
      }
    }
  }
  if (invalid.length !== 0) {
    const issues = [];
    issues.push("bad-requests");
    const ordered = {
      issues: issues,
      kind: kind,
      ok: false,
      value: null
    };
    return ordered;
  }
  const results = [];
  for (const req of requests) {
    const one = checkNoticeSeparation(req);
    results.push(one);
  }
  const innerPairs = [];
  innerPairs.push(["results", results]);
  const inner = Object.fromEntries(innerPairs);
  const topOrdered = {
    kind: kind,
    ok: true,
    value: inner
  };
  return topOrdered;
}
