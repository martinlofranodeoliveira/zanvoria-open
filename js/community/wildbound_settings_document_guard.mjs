function isPlainObject(x) {
  if (typeof x !== "object") {
    return false;
  }
  if (x === null) {
    return false;
  }
  if (Array.isArray(x) === true) {
    return false;
  }
  return true;
}
function isValidKey(k) {
  if (typeof k !== "string") {
    return false;
  }
  if (k.length < 1) {
    return false;
  }
  if (k.length > 32) {
    return false;
  }
  for (const ch of k) {
    const isUpper = ch >= "A" && ch <= "Z";
    const isLower = ch >= "a" && ch <= "z";
    const isDigit = ch >= "0" && ch <= "9";
    const isHyphen = ch === "-";
    const isUnder = ch === "_";
    if (isUpper === false && isLower === false && isDigit === false && isHyphen === false && isUnder === false) {
      return false;
    }
  }
  return true;
}
function isValidStringValue(s) {
  if (typeof s !== "string") {
    return false;
  }
  if (s.length > 64) {
    return false;
  }
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp >= 55296 && cp <= 57343) {
      return false;
    }
    if (cp < 32 && cp !== 10 && cp !== 13 && cp !== 9) {
      return false;
    }
  }
  return true;
}
function isValidSettingValue(v) {
  if (v === null) {
    return true;
  }
  if (typeof v === "boolean") {
    return true;
  }
  if (typeof v === "number") {
    if (v !== v) {
      return false;
    }
    if (v > 9007199254740991) {
      return false;
    }
    if (v < -9007199254740991) {
      return false;
    }
    if (v % 1 !== 0) {
      return false;
    }
    return true;
  }
  if (typeof v === "string") {
    if (isValidStringValue(v) === false) {
      return false;
    }
    return true;
  }
  return false;
}
function makeSettingsValue(settingsInput) {
  if (isPlainObject(settingsInput) === false) {
    return { issues: ["bad-settings"], settings: null, storable: false, storedLength: null, valid: false };
  }
  const keys = [];
  for (const entry of Object.entries(settingsInput)) {
    const k = entry[0];
    keys.push(k);
  }
  keys.sort();
  const orderedEntries = [];
  for (const sk of keys) {
    for (const entry of Object.entries(settingsInput)) {
      const ek = entry[0];
      const ev = entry[1];
      if (ek === sk) {
        orderedEntries.push([sk, ev]);
      }
    }
  }
  const ordered = Object.fromEntries(orderedEntries);
  if (orderedEntries.length > 8) {
    return { issues: ["bad-settings"], settings: ordered, storable: false, storedLength: null, valid: false };
  }
  for (const entry of orderedEntries) {
    const k = entry[0];
    const v = entry[1];
    if (isValidKey(k) === false) {
      return { issues: ["bad-settings"], settings: ordered, storable: false, storedLength: null, valid: false };
    }
    if (isValidSettingValue(v) === false) {
      return { issues: ["bad-settings"], settings: ordered, storable: false, storedLength: null, valid: false };
    }
  }
  const text = JSON.stringify(ordered);
  const len = text.length;
  return { issues: [], settings: ordered, storable: true, storedLength: len, valid: true };
}
export function runFeature(payload) {
  if (isPlainObject(payload) === false) {
    return { issues: ["bad-payload"], kind: "unknown", ok: false, value: null };
  }
  const kind = payload.kind;
  if (kind !== "check-settings-document" && kind !== "check-settings-document-batch") {
    return { issues: ["bad-kind"], kind: "unknown", ok: false, value: null };
  }
  if (kind === "check-settings-document") {
    const value = payload.value;
    if (isPlainObject(value) === false) {
      return { issues: ["bad-value"], kind: kind, ok: false, value: null };
    }
    const valueEntries = Object.entries(value);
    if (valueEntries.length !== 1) {
      return { issues: ["bad-value"], kind: kind, ok: false, value: null };
    }
    const first = valueEntries[0];
    const firstKey = first[0];
    if (firstKey !== "settings") {
      return { issues: ["bad-value"], kind: kind, ok: false, value: null };
    }
    const settings = value.settings;
    const resultValue = makeSettingsValue(settings);
    return { kind: kind, ok: true, value: resultValue };
  }
  const batchValue = payload.value;
  if (isPlainObject(batchValue) === false) {
    return { issues: ["bad-value"], kind: kind, ok: false, value: null };
  }
  const batchEntries = Object.entries(batchValue);
  if (batchEntries.length !== 1) {
    return { issues: ["bad-value"], kind: kind, ok: false, value: null };
  }
  const batchFirst = batchEntries[0];
  const batchFirstKey = batchFirst[0];
  if (batchFirstKey !== "requests") {
    return { issues: ["bad-value"], kind: kind, ok: false, value: null };
  }
  const requests = batchValue.requests;
  if (Array.isArray(requests) === false) {
    return { issues: ["bad-requests"], kind: kind, ok: false, value: null };
  }
  if (requests.length > 16) {
    return { issues: ["bad-requests"], kind: kind, ok: false, value: null };
  }
  const results = [];
  for (const req of requests) {
    if (isPlainObject(req) === false) {
      results.push({ issues: ["bad-settings"], settings: null, storable: false, storedLength: null, valid: false });
    } else {
      const reqEntries = Object.entries(req);
      if (reqEntries.length !== 1) {
        results.push({ issues: ["bad-settings"], settings: null, storable: false, storedLength: null, valid: false });
      } else {
        const reqFirst = reqEntries[0];
        const reqKey = reqFirst[0];
        if (reqKey !== "settings") {
          results.push({ issues: ["bad-settings"], settings: null, storable: false, storedLength: null, valid: false });
        } else {
          const s = req.settings;
          const rv = makeSettingsValue(s);
          results.push(rv);
        }
      }
    }
  }
  return { kind: kind, ok: true, value: { results: results } };
}
