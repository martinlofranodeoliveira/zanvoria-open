import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runFeature } from "../js/community/wildbound_doc_section_guard.mjs";

describe("wildbound doc section guard", () => {
  it("well-formed allowlisted returns valid true allowed true", () => {
    const out = runFeature({
      kind: "check-doc-section",
      value: { headingLevel: 2, headingText: "Documentação e validação", references: ["NOTICE.md"] }
    });
    assert.deepEqual(out, {
      kind: "check-doc-section",
      ok: true,
      value: {
        allowed: true,
        headingLevel: 2,
        headingText: "Documentação e validação",
        issues: [],
        references: ["NOTICE.md"],
        valid: true
      }
    });
    assert.deepEqual(Object.keys(out), ["kind", "ok", "value"]);
    assert.deepEqual(Object.keys(out.value), ["allowed", "headingLevel", "headingText", "issues", "references", "valid"]);
  });
  it("well-formed other reference returns unallowed-reference", () => {
    const out = runFeature({
      kind: "check-doc-section",
      value: { headingLevel: 2, headingText: "Contribuir", references: ["https://example.com"] }
    });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, true);
    assert.equal(out.value.allowed, false);
    assert.deepEqual(out.value.issues, ["unallowed-reference"]);
    assert.deepEqual(out.value.references, ["https://example.com"]);
  });
  it("malformed fields return deterministic bad issues", () => {
    const out = runFeature({
      kind: "check-doc-section",
      value: { headingLevel: 9, headingText: "", references: ["bad ref!"] }
    });
    assert.equal(out.ok, true);
    assert.equal(out.value.valid, false);
    assert.equal(out.value.allowed, false);
    assert.deepEqual(out.value.issues, ["bad-headingLevel", "bad-headingText", "bad-references"]);
    assert.equal(out.value.headingLevel, 9);
    assert.equal(out.value.headingText, "");
  });
  it("batch hierarchy-skip in priority order", () => {
    const out = runFeature({
      kind: "check-doc-section-batch",
      value: {
        sections: [
          { headingLevel: 1, headingText: "Zanvoria", references: [] },
          { headingLevel: 3, headingText: "Detalhe", references: [] }
        ]
      }
    });
    assert.equal(out.ok, true);
    assert.deepEqual(out.value.hierarchyIssues, ["hierarchy-skip"]);
    assert.equal(out.value.results.length, 2);
    assert.deepEqual(Object.keys(out.value), ["hierarchyIssues", "results"]);
  });
  it("batch first-not-h1 and unverifiable priority", () => {
    const firstNotH1 = runFeature({
      kind: "check-doc-section-batch",
      value: { sections: [{ headingLevel: 2, headingText: "Intro", references: [] }] }
    });
    assert.deepEqual(firstNotH1.value.hierarchyIssues, ["first-not-h1"]);
    const unverifiable = runFeature({
      kind: "check-doc-section-batch",
      value: {
        sections: [
          { headingLevel: 1, headingText: "A", references: [] },
          { headingLevel: 2, headingText: "", references: [] }
        ]
      }
    });
    assert.deepEqual(unverifiable.value.hierarchyIssues, ["hierarchy-unverifiable"]);
    const empty = runFeature({ kind: "check-doc-section-batch", value: { sections: [] } });
    assert.deepEqual(empty.value.hierarchyIssues, []);
  });
  it("invalid kind payload value sections return ok false", () => {
    assert.deepEqual(runFeature(null), {
      issues: ["bad-payload"],
      kind: "unknown",
      ok: false,
      value: null
    });
    assert.deepEqual(runFeature({ kind: "nope", value: null }), {
      issues: ["bad-kind"],
      kind: "unknown",
      ok: false,
      value: null
    });
    assert.deepEqual(runFeature({ kind: "check-doc-section", value: null }), {
      issues: ["bad-value"],
      kind: "check-doc-section",
      ok: false,
      value: null
    });
    assert.deepEqual(
      runFeature({ kind: "check-doc-section-batch", value: { sections: "x" } }),
      {
        issues: ["bad-sections"],
        kind: "check-doc-section-batch",
        ok: false,
        value: null
      }
    );
  });
});
