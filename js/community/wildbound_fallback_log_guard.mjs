export function runFeature(payload) {
  if (isPlainObject(payload) === false) {
    return buildError('unknown', 'bad-payload');
  }
  const kind = payload.kind;
  if (kind !== 'check-fallback-log' && kind !== 'check-fallback-log-batch') {
    return buildError('unknown', 'bad-kind');
  }
  if (kind === 'check-fallback-log') {
    const singleValue = payload.value;
    if (isSingleShape(singleValue) === false) {
      return buildError('check-fallback-log', 'bad-value');
    }
    const inner = evaluateSingleValue(singleValue);
    return { kind: 'check-fallback-log', ok: true, value: inner };
  }
  const batchValue = payload.value;
  if (isPlainObject(batchValue) === false) {
    return buildError('check-fallback-log-batch', 'bad-requests');
  }
  const batchEntries = Object.entries(batchValue);
  if (batchEntries.length !== 1) {
    return buildError('check-fallback-log-batch', 'bad-requests');
  }
  for (const entry of batchEntries) {
    const key = entry[0];
    if (key !== 'requests') {
      return buildError('check-fallback-log-batch', 'bad-requests');
    }
  }
  const requests = batchValue.requests;
  if (Array.isArray(requests) === false) {
    return buildError('check-fallback-log-batch', 'bad-requests');
  }
  if (requests.length > 16) {
    return buildError('check-fallback-log-batch', 'bad-requests');
  }
  for (const candidate of requests) {
    if (isSingleShape(candidate) === false) {
      return buildError('check-fallback-log-batch', 'bad-requests');
    }
  }
  const results = [];
  for (const item of requests) {
    const inner = evaluateSingleValue(item);
    results.push(inner);
  }
  const valueEntries = [];
  valueEntries.push(['results', results]);
  const valueObj = Object.fromEntries(valueEntries);
  const topEntries = [];
  topEntries.push(['kind', 'check-fallback-log-batch']);
  topEntries.push(['ok', true]);
  topEntries.push(['value', valueObj]);
  return Object.fromEntries(topEntries);
}
function isPlainObject(input) {
  if (typeof input !== 'object') {
    return false;
  }
  if (input === null) {
    return false;
  }
  if (Array.isArray(input) === true) {
    return false;
  }
  return true;
}
function isSingleShape(input) {
  if (isPlainObject(input) === false) {
    return false;
  }
  const entries = Object.entries(input);
  if (entries.length !== 1) {
    return false;
  }
  for (const entry of entries) {
    const key = entry[0];
    if (key !== 'area') {
      return false;
    }
  }
  return true;
}
function isAreaWellFormed(areaInput) {
  if (typeof areaInput !== 'string') {
    return false;
  }
  if (areaInput.length < 1) {
    return false;
  }
  if (areaInput.length > 32) {
    return false;
  }
  for (const ch of areaInput) {
    const isUpper = ch >= 'A' && ch <= 'Z';
    const isLower = ch >= 'a' && ch <= 'z';
    const isHyphen = ch === '-';
    const okChar = isUpper || isLower || isHyphen;
    if (okChar === false) {
      return false;
    }
  }
  const known = areaInput === 'sdk-init' || areaInput === 'save-read' || areaInput === 'save-write' || areaInput === 'ad-request' || areaInput === 'loading-start' || areaInput === 'loading-stop' || areaInput === 'gameplay-start' || areaInput === 'gameplay-stop';
  if (known === false) {
    return false;
  }
  return true;
}
function getTag(area) {
  if (area === 'sdk-init') {
    return '[platform] CrazyGames SDK unavailable using local fallback.';
  }
  if (area === 'save-read') {
    return '[platform] save read failed';
  }
  if (area === 'save-write') {
    return '[platform] save write failed';
  }
  if (area === 'ad-request') {
    return '[platform] ad request skipped';
  }
  return null;
}
function evaluateSingleValue(singleValue) {
  const areaInput = singleValue.area;
  if (isAreaWellFormed(areaInput) === false) {
    const echo = typeof areaInput === 'string' ? areaInput : null;
    const badIssues = [];
    badIssues.push('bad-area');
    const badEntries = [];
    badEntries.push(['area', echo]);
    badEntries.push(['expectsWarn', false]);
    badEntries.push(['fallback', null]);
    badEntries.push(['issues', badIssues]);
    badEntries.push(['tag', null]);
    badEntries.push(['valid', false]);
    return Object.fromEntries(badEntries);
  }
  const warn = areaInput === 'sdk-init' || areaInput === 'save-read' || areaInput === 'save-write' || areaInput === 'ad-request';
  const fallback = warn ? 'local' : 'noop';
  const tag = getTag(areaInput);
  const goodIssues = [];
  const goodEntries = [];
  goodEntries.push(['area', areaInput]);
  goodEntries.push(['expectsWarn', warn]);
  goodEntries.push(['fallback', fallback]);
  goodEntries.push(['issues', goodIssues]);
  goodEntries.push(['tag', tag]);
  goodEntries.push(['valid', true]);
  return Object.fromEntries(goodEntries);
}
function buildError(kindStr, reason) {
  const issues = [];
  issues.push(reason);
  const entries = [];
  entries.push(['issues', issues]);
  entries.push(['kind', kindStr]);
  entries.push(['ok', false]);
  entries.push(['value', null]);
  return Object.fromEntries(entries);
}
