function isAllowedChar(ch) {
  if (ch === ".") {
    return true;
  }
  if (ch === "-") {
    return true;
  }
  if (ch === "_") {
    return true;
  }
  if (ch >= "A" && ch <= "Z") {
    return true;
  }
  if (ch >= "a" && ch <= "z") {
    return true;
  }
  if (ch >= "0" && ch <= "9") {
    return true;
  }
  return false;
}
function isValidCall(call) {
  if (typeof call !== "string") {
    return false;
  }
  if (call.length < 1) {
    return false;
  }
  if (call.length > 64) {
    return false;
  }
  for (const ch of call) {
    if (isAllowedChar(ch) === false) {
      return false;
    }
  }
  return true;
}
function isAllowlisted(call) {
  if (call === "atob") {
    return true;
  }
  if (call === "btoa") {
    return true;
  }
  if (call === "crypto.getRandomValues") {
    return true;
  }
  if (call === "crypto.subtle.encrypt") {
    return true;
  }
  if (call === "crypto.subtle.importKey") {
    return true;
  }
  if (call === "TextEncoder.encode") {
    return true;
  }
  return false;
}
export function runFeature(payload) {
  if (typeof payload !== "object") {
    return { issues: ["bad-payload"], kind: "unknown", ok: false, value: null };
  }
  if (payload === null) {
    return { issues: ["bad-payload"], kind: "unknown", ok: false, value: null };
  }
  if (Array.isArray(payload) === true) {
    return { issues: ["bad-payload"], kind: "unknown", ok: false, value: null };
  }
  const kind = payload.kind;
  const inputValue = payload.value;
  if (kind !== "check-crypto-call" && kind !== "check-crypto-call-batch") {
    return { issues: ["bad-kind"], kind: "unknown", ok: false, value: null };
  }
  if (kind === "check-crypto-call") {
    if (typeof inputValue !== "object") {
      return { issues: ["bad-value"], kind: "check-crypto-call", ok: false, value: null };
    }
    if (inputValue === null) {
      return { issues: ["bad-value"], kind: "check-crypto-call", ok: false, value: null };
    }
    if (Array.isArray(inputValue) === true) {
      return { issues: ["bad-value"], kind: "check-crypto-call", ok: false, value: null };
    }
    const singleEntries = Object.entries(inputValue);
    if (singleEntries.length !== 1) {
      return { issues: ["bad-value"], kind: "check-crypto-call", ok: false, value: null };
    }
    for (const singleKv of singleEntries) {
      if (singleKv[0] !== "call") {
        return { issues: ["bad-value"], kind: "check-crypto-call", ok: false, value: null };
      }
    }
    const call = inputValue.call;
    if (isValidCall(call) === false) {
      const echoBad = typeof call === "string" ? call : null;
      const badIssues = [];
      badIssues.push("bad-call");
      const badParts = [];
      badParts.push(["allowed", false]);
      badParts.push(["call", echoBad]);
      badParts.push(["issues", badIssues]);
      badParts.push(["reason", null]);
      badParts.push(["valid", false]);
      const badValue = Object.fromEntries(badParts);
      return { kind: "check-crypto-call", ok: true, value: badValue };
    }
    if (isAllowlisted(call) === true) {
      const goodParts = [];
      goodParts.push(["allowed", true]);
      goodParts.push(["call", call]);
      goodParts.push(["issues", []]);
      goodParts.push(["reason", null]);
      goodParts.push(["valid", true]);
      const goodValue = Object.fromEntries(goodParts);
      return { kind: "check-crypto-call", ok: true, value: goodValue };
    } else {
      const unlistedParts = [];
      unlistedParts.push(["allowed", false]);
      unlistedParts.push(["call", call]);
      unlistedParts.push(["issues", []]);
      unlistedParts.push(["reason", "unlisted-call"]);
      unlistedParts.push(["valid", true]);
      const unlistedValue = Object.fromEntries(unlistedParts);
      return { kind: "check-crypto-call", ok: true, value: unlistedValue };
    }
  } else {
    if (typeof inputValue !== "object") {
      return { issues: ["bad-value"], kind: "check-crypto-call-batch", ok: false, value: null };
    }
    if (inputValue === null) {
      return { issues: ["bad-value"], kind: "check-crypto-call-batch", ok: false, value: null };
    }
    if (Array.isArray(inputValue) === true) {
      return { issues: ["bad-value"], kind: "check-crypto-call-batch", ok: false, value: null };
    }
    const batchEntries = Object.entries(inputValue);
    if (batchEntries.length !== 1) {
      return { issues: ["bad-value"], kind: "check-crypto-call-batch", ok: false, value: null };
    }
    for (const batchKv of batchEntries) {
      if (batchKv[0] !== "requests") {
        return { issues: ["bad-value"], kind: "check-crypto-call-batch", ok: false, value: null };
      }
    }
    const requests = inputValue.requests;
    if (Array.isArray(requests) === false) {
      return { issues: ["bad-requests"], kind: "check-crypto-call-batch", ok: false, value: null };
    }
    if (requests.length > 16) {
      return { issues: ["bad-requests"], kind: "check-crypto-call-batch", ok: false, value: null };
    }
    for (const req of requests) {
      if (typeof req !== "object") {
        return { issues: ["bad-requests"], kind: "check-crypto-call-batch", ok: false, value: null };
      }
      if (req === null) {
        return { issues: ["bad-requests"], kind: "check-crypto-call-batch", ok: false, value: null };
      }
      if (Array.isArray(req) === true) {
        return { issues: ["bad-requests"], kind: "check-crypto-call-batch", ok: false, value: null };
      }
      const reqEntries = Object.entries(req);
      if (reqEntries.length !== 1) {
        return { issues: ["bad-requests"], kind: "check-crypto-call-batch", ok: false, value: null };
      }
      for (const reqKv of reqEntries) {
        if (reqKv[0] !== "call") {
          return { issues: ["bad-requests"], kind: "check-crypto-call-batch", ok: false, value: null };
        }
      }
    }
    const results = [];
    for (const item of requests) {
      const itemCall = item.call;
      if (isValidCall(itemCall) === false) {
        const echoItem = typeof itemCall === "string" ? itemCall : null;
        const itemIssues = [];
        itemIssues.push("bad-call");
        const itemBadParts = [];
        itemBadParts.push(["allowed", false]);
        itemBadParts.push(["call", echoItem]);
        itemBadParts.push(["issues", itemIssues]);
        itemBadParts.push(["reason", null]);
        itemBadParts.push(["valid", false]);
        const itemBadValue = Object.fromEntries(itemBadParts);
        results.push(itemBadValue);
      } else {
        if (isAllowlisted(itemCall) === true) {
          const itemGoodParts = [];
          itemGoodParts.push(["allowed", true]);
          itemGoodParts.push(["call", itemCall]);
          itemGoodParts.push(["issues", []]);
          itemGoodParts.push(["reason", null]);
          itemGoodParts.push(["valid", true]);
          const itemGoodValue = Object.fromEntries(itemGoodParts);
          results.push(itemGoodValue);
        } else {
          const itemOtherParts = [];
          itemOtherParts.push(["allowed", false]);
          itemOtherParts.push(["call", itemCall]);
          itemOtherParts.push(["issues", []]);
          itemOtherParts.push(["reason", "unlisted-call"]);
          itemOtherParts.push(["valid", true]);
          const itemOtherValue = Object.fromEntries(itemOtherParts);
          results.push(itemOtherValue);
        }
      }
    }
    return { kind: "check-crypto-call-batch", ok: true, value: { results: results } };
  }
}
