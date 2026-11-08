export function checkDocSection(section) {
  if (isPlainObject(section) === false) {
    return Object.fromEntries([
      ["allowed", false],
      ["headingLevel", null],
      ["headingText", null],
      ["issues", ["bad-headingLevel", "bad-headingText", "bad-references"]],
      ["references", null],
      ["valid", false]
    ]);
  }
  if (hasExactlySingleKeys(section) === false) {
    const lvl = section.headingLevel;
    const txt = section.headingText;
    const refs = section.references;
    const lvlEcho = typeof lvl === "number" ? lvl : null;
    const txtEcho = typeof txt === "string" ? txt : null;
    const refsEcho = Array.isArray(refs) === true ? copyReferences(refs) : null;
    const issues = [];
    if (isValidHeadingLevel(lvl) === false) {
      issues.push("bad-headingLevel");
    }
    if (isValidHeadingText(txt) === false) {
      issues.push("bad-headingText");
    }
    if (isValidReferences(refs) === false) {
      issues.push("bad-references");
    }
    if (issues.length === 0) {
      issues.push("bad-headingLevel");
      issues.push("bad-headingText");
      issues.push("bad-references");
    }
    return Object.fromEntries([
      ["allowed", false],
      ["headingLevel", lvlEcho],
      ["headingText", txtEcho],
      ["issues", issues],
      ["references", refsEcho],
      ["valid", false]
    ]);
  }
  const level = section.headingLevel;
  const text = section.headingText;
  const references = section.references;
  const levelOk = isValidHeadingLevel(level);
  const textOk = isValidHeadingText(text);
  const refsOk = isValidReferences(references);
  const levelEcho = typeof level === "number" ? level : null;
  const textEcho = typeof text === "string" ? text : null;
  const refsEcho = Array.isArray(references) === true ? copyReferences(references) : null;
  if (levelOk === true) {
    if (textOk === true) {
      if (refsOk === true) {
        const bad = [];
        for (const r of references) {
          if (isAllowlisted(r) === false) {
            if (bad.length === 0) {
              bad.push("unallowed-reference");
            }
          }
        }
        if (bad.length === 0) {
          return Object.fromEntries([
            ["allowed", true],
            ["headingLevel", levelEcho],
            ["headingText", textEcho],
            ["issues", bad],
            ["references", refsEcho],
            ["valid", true]
          ]);
        }
        return Object.fromEntries([
          ["allowed", false],
          ["headingLevel", levelEcho],
          ["headingText", textEcho],
          ["issues", bad],
          ["references", refsEcho],
          ["valid", true]
        ]);
      }
    }
  }
  const issues = [];
  if (levelOk === false) {
    issues.push("bad-headingLevel");
  }
  if (textOk === false) {
    issues.push("bad-headingText");
  }
  if (refsOk === false) {
    issues.push("bad-references");
  }
  return Object.fromEntries([
    ["allowed", false],
    ["headingLevel", levelEcho],
    ["headingText", textEcho],
    ["issues", issues],
    ["references", refsEcho],
    ["valid", false]
  ]);
}
export function checkDocSectionBatch(batchValue) {
  const sections = batchValue.sections;
  const results = [];
  for (const s of sections) {
    results.push(checkDocSection(s));
  }
  const validLevels = [];
  const malformed = [];
  for (const r of results) {
    if (r.valid === true) {
      validLevels.push(r.headingLevel);
    }
    if (r.valid === false) {
      malformed.push(true);
    }
  }
  const firstHolder = [];
  for (const lv of validLevels) {
    if (firstHolder.length === 0) {
      firstHolder.push(lv);
    }
  }
  const state = new Map();
  const skipHolder = [];
  for (const lv of validLevels) {
    if (state.has("prev") === false) {
      state.set("prev", lv);
    } else {
      const prev = state.get("prev");
      if (lv > prev + 1) {
        if (skipHolder.length === 0) {
          skipHolder.push(true);
        }
      }
      state.set("prev", lv);
    }
  }
  const hierarchyIssues = [];
  if (sections.length !== 0) {
    if (firstHolder.length !== 0) {
      const first = firstHolder[0];
      if (first !== 1) {
        hierarchyIssues.push("first-not-h1");
      } else {
        if (skipHolder.length !== 0) {
          hierarchyIssues.push("hierarchy-skip");
        } else {
          if (malformed.length !== 0) {
            hierarchyIssues.push("hierarchy-unverifiable");
          }
        }
      }
    } else {
      if (malformed.length !== 0) {
        hierarchyIssues.push("hierarchy-unverifiable");
      }
    }
  }
  return {
    hierarchyIssues: hierarchyIssues,
    results: results
  };
}
export function runFeature(payload) {
  if (isPlainObject(payload) === false) {
    return {
      issues: ["bad-payload"],
      kind: "unknown",
      ok: false,
      value: null
    };
  }
  const kind = payload.kind;
  if (kind !== "check-doc-section") {
    if (kind !== "check-doc-section-batch") {
      return {
        issues: ["bad-kind"],
        kind: "unknown",
        ok: false,
        value: null
      };
    }
  }
  if (kind === "check-doc-section") {
    const value = payload.value;
    if (isPlainObject(value) === false) {
      return {
        issues: ["bad-value"],
        kind: "check-doc-section",
        ok: false,
        value: null
      };
    }
    if (hasExactlySingleKeys(value) === false) {
      return {
        issues: ["bad-value"],
        kind: "check-doc-section",
        ok: false,
        value: null
      };
    }
    const inner = checkDocSection(value);
    return {
      kind: "check-doc-section",
      ok: true,
      value: inner
    };
  }
  const batchValue = payload.value;
  if (isPlainObject(batchValue) === false) {
    return {
      issues: ["bad-value"],
      kind: "check-doc-section-batch",
      ok: false,
      value: null
    };
  }
  if (hasExactlyBatchKeys(batchValue) === false) {
    return {
      issues: ["bad-value"],
      kind: "check-doc-section-batch",
      ok: false,
      value: null
    };
  }
  const sections = batchValue.sections;
  if (Array.isArray(sections) === false) {
    return {
      issues: ["bad-sections"],
      kind: "check-doc-section-batch",
      ok: false,
      value: null
    };
  }
  if (sections.length > 16) {
    return {
      issues: ["bad-sections"],
      kind: "check-doc-section-batch",
      ok: false,
      value: null
    };
  }
  const batchInner = checkDocSectionBatch(batchValue);
  return {
    kind: "check-doc-section-batch",
    ok: true,
    value: batchInner
  };
}
function isPlainObject(v) {
  if (typeof v !== "object") {
    return false;
  }
  if (v === null) {
    return false;
  }
  if (Array.isArray(v) === true) {
    return false;
  }
  return true;
}
function hasExactlySingleKeys(v) {
  const entries = Object.entries(v);
  if (entries.length !== 3) {
    return false;
  }
  const found = new Map();
  for (const e of entries) {
    const k = e[0];
    if (k === "headingLevel") {
      found.set(k, true);
    }
    if (k === "headingText") {
      found.set(k, true);
    }
    if (k === "references") {
      found.set(k, true);
    }
  }
  if (found.size !== 3) {
    return false;
  }
  return true;
}
function hasExactlyBatchKeys(v) {
  const entries = Object.entries(v);
  if (entries.length !== 1) {
    return false;
  }
  const found = new Map();
  for (const e of entries) {
    const k = e[0];
    if (k === "sections") {
      found.set(k, true);
    }
  }
  if (found.size !== 1) {
    return false;
  }
  return true;
}
function isAllowedChar(ch) {
  if (ch === "/") {
    return true;
  }
  if (ch === ".") {
    return true;
  }
  if (ch === "-") {
    return true;
  }
  if (ch === "_") {
    return true;
  }
  if (ch === ":") {
    return true;
  }
  if (ch === "#") {
    return true;
  }
  if (ch >= "A") {
    if (ch <= "Z") {
      return true;
    }
  }
  if (ch >= "a") {
    if (ch <= "z") {
      return true;
    }
  }
  if (ch >= "0") {
    if (ch <= "9") {
      return true;
    }
  }
  return false;
}
function isValidRefString(s) {
  if (typeof s !== "string") {
    return false;
  }
  if (s.length < 1) {
    return false;
  }
  if (s.length > 128) {
    return false;
  }
  for (const ch of s) {
    if (isAllowedChar(ch) === false) {
      return false;
    }
  }
  return true;
}
function isValidHeadingLevel(l) {
  if (Number.isSafeInteger(l) === false) {
    return false;
  }
  if (l < 1) {
    return false;
  }
  if (l > 6) {
    return false;
  }
  return true;
}
function isValidHeadingText(t) {
  if (typeof t !== "string") {
    return false;
  }
  if (t.length < 1) {
    return false;
  }
  if (t.length > 120) {
    return false;
  }
  return true;
}
function isValidReferences(refs) {
  if (Array.isArray(refs) === false) {
    return false;
  }
  if (refs.length > 8) {
    return false;
  }
  for (const r of refs) {
    if (isValidRefString(r) === false) {
      return false;
    }
  }
  return true;
}
function isAllowlisted(ref) {
  if (ref === "NOTICE.md") {
    return true;
  }
  if (ref === "LICENSE") {
    return true;
  }
  if (ref === "https://github.com/martinlofranodeoliveira#projetos-abertos") {
    return true;
  }
  return false;
}
function copyReferences(refs) {
  const out = [];
  for (const r of refs) {
    out.push(r);
  }
  return out;
}
