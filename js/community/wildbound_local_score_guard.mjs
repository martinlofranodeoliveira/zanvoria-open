export function checkLocalScore(value) {
  if (isPlainObject(value) === true) {
    const entries = Object.entries(value);
    if (entries.length === 1) {
      const found = [];
      for (const entry of entries) {
        const k = entry[0];
        if (k === "score") {
          found.push(k);
        }
      }
      if (found.length === 1) {
        const score = value.score;
        return evaluateScore(score);
      }
    }
  }
  return evaluateScore(value);
}
export function checkLocalScoreBatch(value) {
  if (Array.isArray(value) === true) {
    const results = [];
    for (const item of value) {
      const r = checkLocalScore(item);
      results.push(r);
    }
    return results;
  }
  if (isPlainObject(value) === true) {
    const entries = Object.entries(value);
    if (entries.length === 1) {
      const found = [];
      for (const entry of entries) {
        const k = entry[0];
        if (k === "requests") {
          found.push(k);
        }
      }
      if (found.length === 1) {
        const requests = value.requests;
        if (Array.isArray(requests) === true) {
          const results = [];
          for (const item of requests) {
            const r = checkLocalScore(item);
            results.push(r);
          }
          return results;
        }
      }
    }
  }
  const empty = [];
  return empty;
}
export function runFeature(payload) {
  if (isPlainObject(payload) === false) {
    return makeError("unknown", "bad-payload");
  }
  const kind = payload.kind;
  if (kind !== "check-local-score" && kind !== "check-local-score-batch") {
    return makeError("unknown", "bad-kind");
  }
  if (hasPayloadKeys(payload) === false) {
    return makeError(kind, "bad-payload");
  }
  const value = payload.value;
  if (kind === "check-local-score") {
    if (isPlainObject(value) === false) {
      return makeError(kind, "bad-value");
    }
    if (hasScoreKey(value) === false) {
      return makeError(kind, "bad-value");
    }
    const score = value.score;
    const result = evaluateScore(score);
    return makeSingleSuccess(kind, result);
  }
  if (isPlainObject(value) === false) {
    return makeError(kind, "bad-value");
  }
  if (hasRequestsKey(value) === false) {
    return makeError(kind, "bad-value");
  }
  const requests = value.requests;
  if (Array.isArray(requests) === false) {
    return makeError(kind, "bad-requests");
  }
  if (requests.length > 16) {
    return makeError(kind, "bad-requests");
  }
  const bad = [];
  for (const item of requests) {
    if (isPlainObject(item) === false) {
      bad.push(item);
    } else {
      if (hasScoreKey(item) === false) {
        bad.push(item);
      }
    }
  }
  if (bad.length !== 0) {
    return makeError(kind, "bad-requests");
  }
  const results = [];
  for (const item of requests) {
    const score = item.score;
    const r = evaluateScore(score);
    results.push(r);
  }
  return makeBatchSuccess(results);
}
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
function hasPayloadKeys(payload) {
  const entries = Object.entries(payload);
  if (entries.length !== 2) {
    return false;
  }
  const seen = [];
  for (const entry of entries) {
    const k = entry[0];
    if (k === "kind") {
      seen.push(k);
    }
    if (k === "value") {
      seen.push(k);
    }
  }
  if (seen.length !== 2) {
    return false;
  }
  return true;
}
function hasScoreKey(value) {
  const entries = Object.entries(value);
  if (entries.length !== 1) {
    return false;
  }
  const seen = [];
  for (const entry of entries) {
    const k = entry[0];
    if (k === "score") {
      seen.push(k);
    }
  }
  if (seen.length !== 1) {
    return false;
  }
  return true;
}
function hasRequestsKey(value) {
  const entries = Object.entries(value);
  if (entries.length !== 1) {
    return false;
  }
  const seen = [];
  for (const entry of entries) {
    const k = entry[0];
    if (k === "requests") {
      seen.push(k);
    }
  }
  if (seen.length !== 1) {
    return false;
  }
  return true;
}
function isWellFormedScore(score) {
  if (score === null) {
    return true;
  }
  if (typeof score === "boolean") {
    return true;
  }
  if (typeof score === "number") {
    if (Number.isFinite(score) === false) {
      return false;
    }
    if (score > 9007199254740991) {
      return false;
    }
    if (score < -9007199254740991) {
      return false;
    }
    return true;
  }
  if (typeof score === "string") {
    if (score.length > 32) {
      return false;
    }
    const bad = [];
    for (const ch of score) {
      if (ch === "0" || ch === "1" || ch === "2" || ch === "3" || ch === "4" || ch === "5" || ch === "6" || ch === "7" || ch === "8" || ch === "9" || ch === "+" || ch === "-" || ch === "." || ch === "e" || ch === "E" || ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      } else {
        bad.push(ch);
      }
    }
    if (bad.length === 0) {
      return true;
    }
    return false;
  }
  return false;
}
function rawForIssue(score) {
  if (score === null) {
    return score;
  }
  if (typeof score === "boolean") {
    return score;
  }
  if (typeof score === "number") {
    return score;
  }
  if (typeof score === "string") {
    return score;
  }
  return null;
}
function makeValidResult(score) {
  const num = Number(score);
  const safe = Number.isNaN(num) ? 0 : num;
  const rounded = Math.round(safe);
  const normalized = Math.max(0, rounded);
  const stored = String(normalized);
  const issues = [];
  const entries = [];
  entries.push(["issues", issues]);
  entries.push(["normalized", normalized]);
  entries.push(["raw", score]);
  entries.push(["stored", stored]);
  entries.push(["valid", true]);
  return Object.fromEntries(entries);
}
function makeInvalidResult(score) {
  const issues = [];
  issues.push("bad-score");
  const raw = rawForIssue(score);
  const entries = [];
  entries.push(["issues", issues]);
  entries.push(["normalized", null]);
  entries.push(["raw", raw]);
  entries.push(["stored", null]);
  entries.push(["valid", false]);
  return Object.fromEntries(entries);
}
function evaluateScore(score) {
  if (isWellFormedScore(score) === true) {
    return makeValidResult(score);
  }
  return makeInvalidResult(score);
}
function makeError(kindOut, reason) {
  const issues = [];
  issues.push(reason);
  const entries = [];
  entries.push(["issues", issues]);
  entries.push(["kind", kindOut]);
  entries.push(["ok", false]);
  entries.push(["value", null]);
  return Object.fromEntries(entries);
}
function makeSingleSuccess(kindStr, resultObj) {
  const entries = [];
  entries.push(["kind", kindStr]);
  entries.push(["ok", true]);
  entries.push(["value", resultObj]);
  return Object.fromEntries(entries);
}
function makeBatchSuccess(results) {
  const inner = [];
  inner.push(["results", results]);
  const valueObj = Object.fromEntries(inner);
  const entries = [];
  entries.push(["kind", "check-local-score-batch"]);
  entries.push(["ok", true]);
  entries.push(["value", valueObj]);
  return Object.fromEntries(entries);
}
