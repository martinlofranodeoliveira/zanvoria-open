import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runFeature } from '../js/community/wildbound_fallback_log_guard.mjs';

describe('wildbound fallback log guard', () => {
  it('sdk-init returns valid warn local with SDK tag', () => {
    const out = runFeature({ kind: 'check-fallback-log', value: { area: 'sdk-init' } });
    assert.deepStrictEqual(out, {
      kind: 'check-fallback-log',
      ok: true,
      value: {
        area: 'sdk-init',
        expectsWarn: true,
        fallback: 'local',
        issues: [],
        tag: '[platform] CrazyGames SDK unavailable using local fallback.',
        valid: true
      }
    });
    assert.deepStrictEqual(Object.keys(out.value), ['area', 'expectsWarn', 'fallback', 'issues', 'tag', 'valid']);
  });
  it('loading-start returns valid silent noop with null tag', () => {
    const out = runFeature({ kind: 'check-fallback-log', value: { area: 'loading-start' } });
    assert.deepStrictEqual(out, {
      kind: 'check-fallback-log',
      ok: true,
      value: {
        area: 'loading-start',
        expectsWarn: false,
        fallback: 'noop',
        issues: [],
        tag: null,
        valid: true
      }
    });
  });
  it('save-read example returns warn local', () => {
    const out = runFeature({ kind: 'check-fallback-log', value: { area: 'save-read' } });
    assert.deepStrictEqual(out, {
      kind: 'check-fallback-log',
      ok: true,
      value: {
        area: 'save-read',
        expectsWarn: true,
        fallback: 'local',
        issues: [],
        tag: '[platform] save read failed',
        valid: true
      }
    });
  });
  it('bad area object returns valid false with bad-area', () => {
    const out = runFeature({ kind: 'check-fallback-log', value: { area: { x: 1 } } });
    assert.deepStrictEqual(out, {
      kind: 'check-fallback-log',
      ok: true,
      value: {
        area: null,
        expectsWarn: false,
        fallback: null,
        issues: ['bad-area'],
        tag: null,
        valid: false
      }
    });
  });
  it('batch evaluates mixed warn and silent in order', () => {
    const out = runFeature({
      kind: 'check-fallback-log-batch',
      value: { requests: [{ area: 'sdk-init' }, { area: 'loading-start' }, { area: 'save-write' }, { area: 'gameplay-stop' }] }
    });
    assert.equal(out.ok, true);
    assert.equal(out.kind, 'check-fallback-log-batch');
    assert.equal(out.value.results.length, 4);
    assert.equal(out.value.results[0].area, 'sdk-init');
    assert.equal(out.value.results[0].expectsWarn, true);
    assert.equal(out.value.results[0].fallback, 'local');
    assert.equal(out.value.results[0].tag, '[platform] CrazyGames SDK unavailable using local fallback.');
    assert.equal(out.value.results[1].area, 'loading-start');
    assert.equal(out.value.results[1].expectsWarn, false);
    assert.equal(out.value.results[1].fallback, 'noop');
    assert.equal(out.value.results[1].tag, null);
    assert.equal(out.value.results[2].tag, '[platform] save write failed');
    assert.equal(out.value.results[3].fallback, 'noop');
    for (const r of out.value.results) {
      assert.deepStrictEqual(Object.keys(r), ['area', 'expectsWarn', 'fallback', 'issues', 'tag', 'valid']);
    }
  });
  it('unknown kind returns bad-kind with ordered keys', () => {
    const out = runFeature({ kind: 'nope', value: {} });
    assert.deepStrictEqual(out, { issues: ['bad-kind'], kind: 'unknown', ok: false, value: null });
    assert.deepStrictEqual(Object.keys(out), ['issues', 'kind', 'ok', 'value']);
  });
  it('non-object payload returns bad-payload with ordered keys', () => {
    const out = runFeature(null);
    assert.deepStrictEqual(out, { issues: ['bad-payload'], kind: 'unknown', ok: false, value: null });
    assert.deepStrictEqual(Object.keys(out), ['issues', 'kind', 'ok', 'value']);
  });
});
