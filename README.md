# zanvoria-open

Code-only open edition of the browser game, with complete gameplay source and local saves. Rendering uses the existing procedural canvas fallback and browser-generated sound. Original images, 3D files, recorded voices and marketing material are excluded because redistribution rights were not established.

Requires Node.js 22 or later. No package installation or credentials are needed.

```sh
npm run check
npm test
npm start
```

Open http://127.0.0.1:8080. Gameplay and scores stay in this browser; no cloud leaderboard, SDK download or production deployment is included. The private original and its history are preserved separately. See NOTICE.md.

Validation covers JavaScript syntax and local HTTP serving, including denied private paths and unsupported writes. The game was also opened and started manually in a browser with the procedural renderer. This is a smoke check, not exhaustive gameplay coverage.

Local development server (`server.js`) binds only to `127.0.0.1` (set `PORT=0` for an ephemeral loopback port) and serves only `index.html` plus files under `js/` and `css/` with `Cache-Control: no-store`. It returns `404` for dotfile segments such as `.git`/`.env`, path traversal outside the project root, symlink files or paths that traverse a symlinked directory (GET and HEAD never expose the symlink target), and `405` for methods other than `GET`/`HEAD`. It is a minimal local preview aid, not a production deployment.


<!-- community-core:wildbound-local-score-guard -->
### Wildbound Local Score Guard

Gives contributors to the code-only local browser game a tiny deterministic checker for the documented local last-score rounding and clamping so score normalization and String storage decisions can be unit-tested as pure JSON without storage, SDK, leaderboard, network, sound or rendering.

Reusable deterministic JSON core: `js/community/wildbound_local_score_guard.mjs`, API `runFeature(payload)`. This module is independently tested; application/UI integration is outside this change.

Exposes runFeature(payload) as the sole required entry point; optional pure helpers checkLocalScore and checkLocalScoreBatch may be exposed. Input payload must be a plain JSON object with string field kind equal to check-local-score or check-local-score-batch and a value field. For check-local-score value must be a plain object with exactly key score. score must be null, boolean, finite safe number within plus-minus 9007199254740991, or string length 0 to 32 where each character verified with for-of is digit 0-9, plus, minus, dot, e, E, space, TAB, LF or CR. When well-formed return ok true with kind echo and value holding alphabetically ordered issues, normalized, raw, stored and valid. raw echoes input score, normalized equals Math.max(0, Math.round(Number(score) or 0 when NaN)) with negative and NaN clamped to 0, stored equals String(normalized), valid true with issues empty. When score malformed return ok true with kind echo and value holding same keys where valid false, normalized null, stored null, raw echoes input when null, boolean, number or string else null, and issues holding single bad-score. For check-local-score-batch value must be a plain object with exactly key requests holding array length 0 to 16 where each element is a score wrapper object as above; each evaluated independently in order with for-of and results collected with push; success returns ok true with kind check-local-score-batch and value holding results array where each result holds the five ordered keys above. Invalid kind or non-object payload or malformed value returns ok false with kind unknown when kind missing or unknown else input kind plus value null plus issues array holding one reason among bad-kind, bad-payload, bad-value and bad-requests. All operations use for-of over Object entries and string characters, build objects with object literals and Object.fromEntries and arrays with push, preserve input, order keys alphabetically at every level, builtins never aliased or passed as callbacks, computed access only for literal nonnegative numeric indices, no prototype or constructor access, no reassignment or property mutation, and are pure deterministic JSON to JSON with no input output, environment access, Date, time, randomness, callbacks or external packages. Mirrors only the documented local last-score rounding and clamping with String storage and never performs network, storage, SDK, leaderboard submission, sound or rendering.

Examples (JSON input and expected output):

```json
{
  "input": {
    "kind": "check-local-score",
    "value": {
      "score": 1.6
    }
  },
  "output": {
    "kind": "check-local-score",
    "ok": true,
    "value": {
      "issues": [],
      "normalized": 2,
      "raw": 1.6,
      "stored": "2",
      "valid": true
    }
  }
}
```

```json
{
  "input": {
    "kind": "check-local-score",
    "value": {
      "score": -4.2
    }
  },
  "output": {
    "kind": "check-local-score",
    "ok": true,
    "value": {
      "issues": [],
      "normalized": 0,
      "raw": -4.2,
      "stored": "0",
      "valid": true
    }
  }
}
```

```json
{
  "input": {
    "kind": "check-local-score",
    "value": {
      "score": {
        "x": 1
      }
    }
  },
  "output": {
    "kind": "check-local-score",
    "ok": true,
    "value": {
      "issues": [
        "bad-score"
      ],
      "normalized": null,
      "raw": null,
      "stored": null,
      "valid": false
    }
  }
}
```

Public regression tests: `test/community_wildbound_local_score_guard.test.js`.
