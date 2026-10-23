export function checkValidationScope(scopeValue) {
  const flagDenied = scopeValue.advertisesDeniedPaths;
  const flagServing = scopeValue.advertisesServingCheck;
  const flagSyntax = scopeValue.advertisesSyntaxCheck;
  const flagUnsupported = scopeValue.advertisesUnsupportedWrites;
  const deniedIsBool = typeof flagDenied === "boolean";
  const servingIsBool = typeof flagServing === "boolean";
  const syntaxIsBool = typeof flagSyntax === "boolean";
  const unsupportedIsBool = typeof flagUnsupported === "boolean";
  const allBool = deniedIsBool === true && servingIsBool === true && syntaxIsBool === true && unsupportedIsBool === true;
  const echoDenied = deniedIsBool === true ? flagDenied : null;
  const echoServing = servingIsBool === true ? flagServing : null;
  const echoSyntax = syntaxIsBool === true ? flagSyntax : null;
  const echoUnsupported = unsupportedIsBool === true ? flagUnsupported : null;
  const missingIssues = [];
  const badIssues = [];
  if (flagDenied === false) {
    missingIssues.push("missing-denied-paths");
  }
  if (flagServing === false) {
    missingIssues.push("missing-serving-check");
  }
  if (flagSyntax === false) {
    missingIssues.push("missing-syntax-check");
  }
  if (flagUnsupported === false) {
    missingIssues.push("missing-unsupported-writes");
  }
  if (deniedIsBool === false) {
    badIssues.push("bad-denied-paths");
  }
  if (servingIsBool === false) {
    badIssues.push("bad-serving-check");
  }
  if (syntaxIsBool === false) {
    badIssues.push("bad-syntax-check");
  }
  if (unsupportedIsBool === false) {
    badIssues.push("bad-unsupported-writes");
  }
  const completeWhenValid = missingIssues.length === 0;
  const valid = allBool === true ? true : false;
  const complete = allBool === true ? completeWhenValid : false;
  const issues = allBool === true ? missingIssues : badIssues;
  const resultEntries = [];
  resultEntries.push(["advertisesDeniedPaths", echoDenied]);
  resultEntries.push(["advertisesServingCheck", echoServing]);
  resultEntries.push(["advertisesSyntaxCheck", echoSyntax]);
  resultEntries.push(["advertisesUnsupportedWrites", echoUnsupported]);
  resultEntries.push(["complete", complete]);
  resultEntries.push(["issues", issues]);
  resultEntries.push(["valid", valid]);
  const result = Object.fromEntries(resultEntries);
  return result;
}
function isPlainObject(candidate) {
  const isObject = typeof candidate === "object";
  const notNull = candidate !== null;
  const notArray = Array.isArray(candidate) === false;
  const plain = isObject === true && notNull === true && notArray === true;
  return plain;
}
function hasExactScopeKeys(candidate) {
  const plain = isPlainObject(candidate);
  if (plain === false) {
    return false;
  }
  const countOk = Object.entries(candidate).length === 4;
  const unexpected = [];
  for (const entry of Object.entries(candidate)) {
    const entryKey = entry[0];
    const isDenied = entryKey === "advertisesDeniedPaths";
    const isServing = entryKey === "advertisesServingCheck";
    const isSyntax = entryKey === "advertisesSyntaxCheck";
    const isUnsupported = entryKey === "advertisesUnsupportedWrites";
    const isKnown = isDenied === true || isServing === true || isSyntax === true || isUnsupported === true;
    if (isKnown === false) {
      unexpected.push(entryKey);
    }
  }
  const noUnexpected = unexpected.length === 0;
  const exact = countOk === true && noUnexpected === true;
  return exact;
}
function hasExactBatchKeys(candidate) {
  const plain = isPlainObject(candidate);
  if (plain === false) {
    return false;
  }
  const countOk = Object.entries(candidate).length === 1;
  const unexpected = [];
  for (const entry of Object.entries(candidate)) {
    const entryKey = entry[0];
    const isRequests = entryKey === "requests";
    if (isRequests === false) {
      unexpected.push(entryKey);
    }
  }
  const noUnexpected = unexpected.length === 0;
  const exact = countOk === true && noUnexpected === true;
  return exact;
}
export function checkValidationScopeBatch(batchValue) {
  const plain = isPlainObject(batchValue);
  if (plain === false) {
    return null;
  }
  const exact = hasExactBatchKeys(batchValue);
  if (exact === false) {
    return null;
  }
  const requests = batchValue.requests;
  const isArray = Array.isArray(requests);
  if (isArray === false) {
    return null;
  }
  const tooLong = requests.length > 16;
  if (tooLong === true) {
    return null;
  }
  const problems = [];
  for (const req of requests) {
    const ok = hasExactScopeKeys(req);
    if (ok === false) {
      problems.push("bad");
    }
  }
  const hasProblems = problems.length !== 0;
  if (hasProblems === true) {
    return null;
  }
  const results = [];
  for (const req of requests) {
    const single = checkValidationScope(req);
    results.push(single);
  }
  return results;
}
export function runFeature(payload) {
  const payloadPlain = isPlainObject(payload);
  if (payloadPlain === false) {
    const issueList = [];
    issueList.push("bad-payload");
    const topEntries = [];
    topEntries.push(["issues", issueList]);
    topEntries.push(["kind", "unknown"]);
    topEntries.push(["ok", false]);
    topEntries.push(["value", null]);
    const out = Object.fromEntries(topEntries);
    return out;
  }
  const inputKind = payload.kind;
  const kindIsScope = inputKind === "check-validation-scope";
  const kindIsBatch = inputKind === "check-validation-scope-batch";
  const kindKnown = kindIsScope === true || kindIsBatch === true;
  if (kindKnown === false) {
    const issueList = [];
    issueList.push("bad-kind");
    const topEntries = [];
    topEntries.push(["issues", issueList]);
    topEntries.push(["kind", "unknown"]);
    topEntries.push(["ok", false]);
    topEntries.push(["value", null]);
    const out = Object.fromEntries(topEntries);
    return out;
  }
  const inputValue = payload.value;
  if (kindIsScope === true) {
    const valuePlain = isPlainObject(inputValue);
    if (valuePlain === false) {
      const issueList = [];
      issueList.push("bad-value");
      const topEntries = [];
      topEntries.push(["issues", issueList]);
      topEntries.push(["kind", inputKind]);
      topEntries.push(["ok", false]);
      topEntries.push(["value", null]);
      const out = Object.fromEntries(topEntries);
      return out;
    }
    const exact = hasExactScopeKeys(inputValue);
    if (exact === false) {
      const issueList = [];
      issueList.push("bad-value");
      const topEntries = [];
      topEntries.push(["issues", issueList]);
      topEntries.push(["kind", inputKind]);
      topEntries.push(["ok", false]);
      topEntries.push(["value", null]);
      const out = Object.fromEntries(topEntries);
      return out;
    }
    const inner = checkValidationScope(inputValue);
    const topEntries = [];
    topEntries.push(["kind", inputKind]);
    topEntries.push(["ok", true]);
    topEntries.push(["value", inner]);
    const out = Object.fromEntries(topEntries);
    return out;
  }
  const batchPlain = isPlainObject(inputValue);
  if (batchPlain === false) {
    const issueList = [];
    issueList.push("bad-requests");
    const topEntries = [];
    topEntries.push(["issues", issueList]);
    topEntries.push(["kind", inputKind]);
    topEntries.push(["ok", false]);
    topEntries.push(["value", null]);
    const out = Object.fromEntries(topEntries);
    return out;
  }
  const batchExact = hasExactBatchKeys(inputValue);
  if (batchExact === false) {
    const issueList = [];
    issueList.push("bad-requests");
    const topEntries = [];
    topEntries.push(["issues", issueList]);
    topEntries.push(["kind", inputKind]);
    topEntries.push(["ok", false]);
    topEntries.push(["value", null]);
    const out = Object.fromEntries(topEntries);
    return out;
  }
  const requests = inputValue.requests;
  const isArray = Array.isArray(requests);
  if (isArray === false) {
    const issueList = [];
    issueList.push("bad-requests");
    const topEntries = [];
    topEntries.push(["issues", issueList]);
    topEntries.push(["kind", inputKind]);
    topEntries.push(["ok", false]);
    topEntries.push(["value", null]);
    const out = Object.fromEntries(topEntries);
    return out;
  }
  const tooLong = requests.length > 16;
  if (tooLong === true) {
    const issueList = [];
    issueList.push("bad-requests");
    const topEntries = [];
    topEntries.push(["issues", issueList]);
    topEntries.push(["kind", inputKind]);
    topEntries.push(["ok", false]);
    topEntries.push(["value", null]);
    const out = Object.fromEntries(topEntries);
    return out;
  }
  const problems = [];
  for (const req of requests) {
    const ok = hasExactScopeKeys(req);
    if (ok === false) {
      problems.push("bad");
    }
  }
  const hasProblems = problems.length !== 0;
  if (hasProblems === true) {
    const issueList = [];
    issueList.push("bad-requests");
    const topEntries = [];
    topEntries.push(["issues", issueList]);
    topEntries.push(["kind", inputKind]);
    topEntries.push(["ok", false]);
    topEntries.push(["value", null]);
    const out = Object.fromEntries(topEntries);
    return out;
  }
  const results = [];
  for (const req of requests) {
    const single = checkValidationScope(req);
    results.push(single);
  }
  const valueEntries = [];
  valueEntries.push(["results", results]);
  const valueObj = Object.fromEntries(valueEntries);
  const topEntries = [];
  topEntries.push(["kind", inputKind]);
  topEntries.push(["ok", true]);
  topEntries.push(["value", valueObj]);
  const out = Object.fromEntries(topEntries);
  return out;
}
