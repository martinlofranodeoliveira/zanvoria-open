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


<!-- community-core:wildbound-preview-route-guard -->
### Wildbound Preview Route Guard

Gives contributors to the code-only local browser game a tiny deterministic checker for the documented loopback preview method and path gating so allowed versus denied route decisions can be unit-tested as pure JSON without server, storage, SDK, network, sound or rendering.

Reusable deterministic JSON core: `js/community/wildbound_preview_route_guard.mjs`, API `runFeature(payload)`. This module is independently tested; application/UI integration is outside this change.

Exposes runFeature(payload) as the sole required entry point; optional pure helpers checkPreviewRoute and checkPreviewRouteBatch may be exposed. Input payload must be a plain JSON object with string field kind equal to check-preview-route or check-preview-route-batch and a value field. For check-preview-route value must be a plain object with exactly keys isSymlink, method, target and traversesSymlink. isSymlink must be boolean, traversesSymlink must be boolean, method must be string length 1 to 8 where each character verified with for-of is A-Z, target must be string length 1 to 128 starting with slash where each character verified with for-of is letter digit slash dot hyphen or underscore. When well-formed return ok true with kind echo and value holding alphabetically ordered allowed, blockedReason, cache, isSymlink, issues, method, status, target, traversesSymlink and valid. valid true with issues empty; method target isSymlink traversesSymlink echo input; status is 405 with allowed false cache null blockedReason method-not-allowed when method is not GET or HEAD, else 404 with allowed false cache null when isSymlink true or traversesSymlink true with blockedReason symlink-denied, else when any slash-separated segment starts with dot with blockedReason dotfile-denied, else when any slash-separated segment equals double-dot with blockedReason traversal-denied, else when target is not slash or slash-index.html or does not start with slash-js-slash or slash-css-slash with blockedReason not-found, else 200 with allowed true cache no-store blockedReason null. When any field malformed return ok true with kind echo and value holding same ten keys where valid false, allowed false, status null, cache null, blockedReason null, method echoes when string else null, target echoes when string else null, isSymlink echoes when boolean else null, traversesSymlink echoes when boolean else null, and issues holds one or more of bad-method, bad-target, bad-symlink-flag and bad-traversal-flag in that deterministic order. For check-preview-route-batch value must be a plain object with exactly key requests holding array length 0 to 16 where each element is a preview-route value object as above; each evaluated independently in order with for-of and results collected with push; success returns ok true with kind check-preview-route-batch and value holding results array where each result holds the ten ordered keys above. Invalid kind or non-object payload or malformed value returns ok false with kind unknown when kind missing or unknown else input kind plus value null plus issues array holding one reason among bad-kind, bad-payload, bad-value and bad-requests. All operations use for-of over Object entries and string characters, build objects with object literals and Object.fromEntries and arrays with push, preserve input, order keys alphabetically at every level, builtins never aliased or passed as callbacks, computed access only for literal nonnegative numeric indices, no prototype or constructor access, no reassignment or property mutation, and are pure deterministic JSON to JSON with no input output, environment access, Date, time, randomness, callbacks or external packages. Mirrors only the documented loopback preview method and path gating with Cache-Control no-store and never performs server, storage, SDK, leaderboard, network, sound or rendering.

Examples (JSON input and expected output):

```json
{
  "input": {
    "kind": "check-preview-route",
    "value": {
      "isSymlink": false,
      "method": "GET",
      "target": "/js/game.js",
      "traversesSymlink": false
    }
  },
  "output": {
    "kind": "check-preview-route",
    "ok": true,
    "value": {
      "allowed": true,
      "blockedReason": null,
      "cache": "no-store",
      "isSymlink": false,
      "issues": [],
      "method": "GET",
      "status": 200,
      "target": "/js/game.js",
      "traversesSymlink": false,
      "valid": true
    }
  }
}
```

```json
{
  "input": {
    "kind": "check-preview-route",
    "value": {
      "isSymlink": false,
      "method": "POST",
      "target": "/index.html",
      "traversesSymlink": false
    }
  },
  "output": {
    "kind": "check-preview-route",
    "ok": true,
    "value": {
      "allowed": false,
      "blockedReason": "method-not-allowed",
      "cache": null,
      "isSymlink": false,
      "issues": [],
      "method": "POST",
      "status": 405,
      "target": "/index.html",
      "traversesSymlink": false,
      "valid": true
    }
  }
}
```

```json
{
  "input": {
    "kind": "check-preview-route",
    "value": {
      "isSymlink": false,
      "method": "GET",
      "target": {
        "x": 1
      },
      "traversesSymlink": false
    }
  },
  "output": {
    "kind": "check-preview-route",
    "ok": true,
    "value": {
      "allowed": false,
      "blockedReason": null,
      "cache": null,
      "isSymlink": false,
      "issues": [
        "bad-target"
      ],
      "method": "GET",
      "status": null,
      "target": null,
      "traversesSymlink": false,
      "valid": false
    }
  }
}
```

Public regression tests: `test/community_wildbound_preview_route_guard.test.js`.


<!-- community-core:wildbound-local-store-guard -->
### Wildbound Local Store Key Guard

Gives contributors to the code-only local browser game a tiny deterministic checker for the documented local-only storage keys so save, settings and last-score key allowlisting can be unit-tested as pure JSON without storage, SDK, leaderboard, network, sound or rendering.

Reusable deterministic JSON core: `js/community/wildbound_local_store_guard.mjs`, API `runFeature(payload)`. This module is independently tested; application/UI integration is outside this change.

Exposes runFeature(payload) as the sole required entry point; optional pure helpers checkStoreKey and checkStoreKeyBatch may be exposed. Input payload must be a plain JSON object with string field kind equal to check-store-key or check-store-key-batch and a value field. For check-store-key value must be a plain object with exactly key storeKey. storeKey must be string length 1 to 64 where each character verified with for-of is A-Za-z0-9 colon hyphen or underscore. When well-formed return ok true with kind echo and value holding alphabetically ordered allowed, issues, reason, storeKey and valid. storeKey echoes input; valid true with issues empty; allowed true with reason null only when storeKey equals aether-rift:wildbound:save or aether-rift:wildbound:settings or aether-rift:wildbound:last-score else allowed false with reason unlisted-key. When storeKey malformed return ok true with kind echo and value holding same five keys where valid false, allowed false, reason null, storeKey echoes when string else null, and issues holding single bad-store-key. For check-store-key-batch value must be a plain object with exactly key requests holding array length 0 to 16 where each element is a store-key value object as above; each evaluated independently in order with for-of and results collected with push; success returns ok true with kind check-store-key-batch and value holding results array where each result holds the five ordered keys above. Invalid kind or non-object payload or malformed value returns ok false with kind unknown when kind missing or unknown else input kind plus value null plus issues array holding one reason among bad-kind, bad-payload, bad-value and bad-requests. All operations use for-of over Object entries and string characters, build objects with object literals and Object.fromEntries and arrays with push, preserve input, order keys alphabetically at every level, builtins never aliased or passed as callbacks, computed access only for literal nonnegative numeric indices, no prototype or constructor access, no reassignment or property mutation, and are pure deterministic JSON to JSON with no input output, environment access, Date, time, randomness, callbacks or external packages. Mirrors only the documented local-only storage keys for saves settings and last-score with String storage and never performs storage, SDK, leaderboard, network, sound or rendering.

Examples (JSON input and expected output):

```json
{
  "input": {
    "kind": "check-store-key",
    "value": {
      "storeKey": "aether-rift:wildbound:save"
    }
  },
  "output": {
    "kind": "check-store-key",
    "ok": true,
    "value": {
      "allowed": true,
      "issues": [],
      "reason": null,
      "storeKey": "aether-rift:wildbound:save",
      "valid": true
    }
  }
}
```

```json
{
  "input": {
    "kind": "check-store-key",
    "value": {
      "storeKey": "aether-rift:wildbound:other"
    }
  },
  "output": {
    "kind": "check-store-key",
    "ok": true,
    "value": {
      "allowed": false,
      "issues": [],
      "reason": "unlisted-key",
      "storeKey": "aether-rift:wildbound:other",
      "valid": true
    }
  }
}
```

```json
{
  "input": {
    "kind": "check-store-key",
    "value": {
      "storeKey": {
        "x": 1
      }
    }
  },
  "output": {
    "kind": "check-store-key",
    "ok": true,
    "value": {
      "allowed": false,
      "issues": [
        "bad-store-key"
      ],
      "reason": null,
      "storeKey": null,
      "valid": false
    }
  }
}
```

Public regression tests: `test/community_wildbound_local_store_guard.test.js`.


<!-- community-core:wildbound-bridge-method-guard -->
### Wildbound Bridge Method Guard

Gives contributors to the code-only local browser game a tiny deterministic checker for the documented CrazyBridge method allowlisting so bridge call gating can be unit-tested as pure JSON without storage, SDK, network, sound or rendering.

Reusable deterministic JSON core: `js/community/wildbound_bridge_method_guard.mjs`, API `runFeature(payload)`. This module is independently tested; application/UI integration is outside this change.

Exposes runFeature(payload) as the sole required entry point; optional pure helpers checkBridgeMethod and checkBridgeMethodBatch may be exposed. Input payload must be a plain JSON object with string field kind equal to check-bridge-method or check-bridge-method-batch and a value field. For check-bridge-method value must be a plain object with exactly key method. method must be string length 1 to 32 where each character verified with for-of is A-Z or a-z. When well-formed return ok true with kind echo and value holding alphabetically ordered allowed, issues, method, reason and valid. method echoes input; valid true with issues empty; allowed true with reason null only when method equals init or loadingStart or loadingStop or gameplayStart or gameplayStop or getSave or setSave or getSettings or setSettings or requestAd or onMuteChange or submitScore or isCrazyGames else allowed false with reason unlisted-method. When method malformed return ok true with kind echo and value holding same five keys where valid false, allowed false, reason null, method echoes when string else null, and issues holding single bad-method. For check-bridge-method-batch value must be a plain object with exactly key requests holding array length 0 to 16 where each element is a bridge-method value object as above; each evaluated independently in order with for-of and results collected with push; success returns ok true with kind check-bridge-method-batch and value holding results array where each result holds the five ordered keys above. Invalid kind or non-object payload or malformed value returns ok false with kind unknown when kind missing or unknown else input kind plus value null plus issues array holding one reason among bad-kind, bad-payload, bad-value and bad-requests. All operations use for-of over Object entries and string characters, build objects with object literals and Object.fromEntries and arrays with push, preserve input, order keys alphabetically at every level, builtins never aliased or passed as callbacks, computed access only for literal nonnegative numeric indices, no prototype or constructor access, no reassignment or property mutation, and are pure deterministic JSON to JSON with no input output, environment access, Date, time, randomness, callbacks or external packages. Mirrors only the documented CrazyBridge method allowlisting and never performs storage, SDK, leaderboard, network, sound or rendering.

Examples (JSON input and expected output):

```json
{
  "input": {
    "kind": "check-bridge-method",
    "value": {
      "method": "getSave"
    }
  },
  "output": {
    "kind": "check-bridge-method",
    "ok": true,
    "value": {
      "allowed": true,
      "issues": [],
      "method": "getSave",
      "reason": null,
      "valid": true
    }
  }
}
```

```json
{
  "input": {
    "kind": "check-bridge-method",
    "value": {
      "method": "submitHighScore"
    }
  },
  "output": {
    "kind": "check-bridge-method",
    "ok": true,
    "value": {
      "allowed": false,
      "issues": [],
      "method": "submitHighScore",
      "reason": "unlisted-method",
      "valid": true
    }
  }
}
```

```json
{
  "input": {
    "kind": "check-bridge-method",
    "value": {
      "method": {
        "x": 1
      }
    }
  },
  "output": {
    "kind": "check-bridge-method",
    "ok": true,
    "value": {
      "allowed": false,
      "issues": [
        "bad-method"
      ],
      "method": null,
      "reason": null,
      "valid": false
    }
  }
}
```

Public regression tests: `test/community_wildbound_bridge_method_guard.test.js`.


<!-- community-core:wildbound-node-engine-guard -->
### Wildbound Node Engine Guard

Gives contributors to the code-only local browser game a tiny deterministic checker for the documented Node.js 22-or-later requirement so engine gating can be unit-tested as pure JSON without toolchain, server, storage, SDK, network, sound or rendering.

Reusable deterministic JSON core: `js/community/wildbound_node_engine_guard.mjs`, API `runFeature(payload)`. This module is independently tested; application/UI integration is outside this change.

Exposes runFeature(payload) as the sole required entry point; optional pure helpers checkNodeEngine and checkNodeEngineBatch may be exposed. Input payload must be a plain JSON object with string field kind equal to check-node-engine or check-node-engine-batch and a value field. For check-node-engine value must be a plain object with exactly key major. major must be finite safe number within 0 to 1000 with Math.floor(major) equal to major. When well-formed return ok true with kind echo and value holding alphabetically ordered issues, major, reason, supported and valid. major echoes input; valid true with issues empty; supported true with reason null only when major is at least 22 else supported false with reason engine-too-old. When major malformed return ok true with kind echo and value holding same five keys where valid false, supported false, reason null, major echoes when number else null, and issues holding single bad-major. For check-node-engine-batch value must be a plain object with exactly key requests holding array length 0 to 16 where each element is a node-engine value object as above; each evaluated independently in order with for-of and results collected with push; success returns ok true with kind check-node-engine-batch and value holding results array where each result holds the five ordered keys above. Invalid kind or non-object payload or malformed value returns ok false with kind unknown when kind missing or unknown else input kind plus value null plus issues array holding one reason among bad-kind, bad-payload, bad-value and bad-requests. All operations use for-of over Object entries, build objects with object literals and Object.fromEntries and arrays with push, preserve input, order keys alphabetically at every level, builtins never aliased or passed as callbacks, computed access only for literal nonnegative numeric indices, no prototype or constructor access, no reassignment or property mutation, and are pure deterministic JSON to JSON with no input output, environment access, Date, time, randomness, callbacks or external packages. Mirrors only the documented Node 22-or-later requirement and never performs toolchain, server, storage, SDK, leaderboard, network, sound or rendering.

Examples (JSON input and expected output):

```json
{
  "input": {
    "kind": "check-node-engine",
    "value": {
      "major": 22
    }
  },
  "output": {
    "kind": "check-node-engine",
    "ok": true,
    "value": {
      "issues": [],
      "major": 22,
      "reason": null,
      "supported": true,
      "valid": true
    }
  }
}
```

```json
{
  "input": {
    "kind": "check-node-engine",
    "value": {
      "major": 16
    }
  },
  "output": {
    "kind": "check-node-engine",
    "ok": true,
    "value": {
      "issues": [],
      "major": 16,
      "reason": "engine-too-old",
      "supported": false,
      "valid": true
    }
  }
}
```

```json
{
  "input": {
    "kind": "check-node-engine",
    "value": {
      "major": "22"
    }
  },
  "output": {
    "kind": "check-node-engine",
    "ok": true,
    "value": {
      "issues": [
        "bad-major"
      ],
      "major": null,
      "reason": null,
      "supported": false,
      "valid": false
    }
  }
}
```

Public regression tests: `test/community_wildbound_node_engine_guard.test.js`.


<!-- community-core:wildbound-loopback-bind-guard -->
### Wildbound Loopback Bind Guard

Gives contributors to the code-only local browser game a tiny deterministic checker for the documented 127.0.0.1-only preview binding so loopback versus non-loopback host decisions and port shape can be unit-tested as pure JSON without server, storage, SDK, network, sound or rendering.

Reusable deterministic JSON core: `js/community/wildbound_loopback_bind_guard.mjs`, API `runFeature(payload)`. This module is independently tested; application/UI integration is outside this change.

Exposes runFeature(payload) as the sole required entry point; optional pure helpers checkLoopbackBind and checkLoopbackBindBatch may be exposed. Input payload must be a plain JSON object with string field kind equal to check-loopback-bind or check-loopback-bind-batch and a value field. For check-loopback-bind value must be a plain object with exactly keys host and port. host must be string length 1 to 64 where each character verified with for-of is digit 0-9 or dot, port must be finite safe number within 0 to 65535 with Math.floor(port) equal to port. When well-formed return ok true with kind echo and value holding alphabetically ordered allowed, host, issues, port, reason and valid. host and port echo input; valid true with issues empty; allowed true with reason null only when host equals 127.0.0.1 else allowed false with reason non-loopback-host. When any field malformed return ok true with kind echo and value holding same six keys where valid false, allowed false, reason null, host echoes when string else null, port echoes when number else null, and issues holds one or more of bad-host and bad-port in that deterministic order. For check-loopback-bind-batch value must be a plain object with exactly key requests holding array length 0 to 16 where each element is a loopback-bind value object as above; each evaluated independently in order with for-of and results collected with push; success returns ok true with kind check-loopback-bind-batch and value holding results array where each result holds the six ordered keys above. Invalid kind or non-object payload or malformed value returns ok false with kind unknown when kind missing or unknown else input kind plus value null plus issues array holding one reason among bad-kind, bad-payload, bad-value and bad-requests. All operations use for-of over Object entries and string characters, build objects with object literals and Object.fromEntries and arrays with push, preserve input, order keys alphabetically at every level, builtins never aliased or passed as callbacks, computed access only for literal nonnegative numeric indices, no prototype or constructor access, no reassignment or property mutation, and are pure deterministic JSON to JSON with no input output, environment access, Date, time, randomness, callbacks or external packages. Mirrors only the documented loopback 127.0.0.1 binding with PORT 0 ephemeral support and never performs server, storage, SDK, leaderboard, network, sound or rendering.

Examples (JSON input and expected output):

```json
{
  "input": {
    "kind": "check-loopback-bind",
    "value": {
      "host": "127.0.0.1",
      "port": 8080
    }
  },
  "output": {
    "kind": "check-loopback-bind",
    "ok": true,
    "value": {
      "allowed": true,
      "host": "127.0.0.1",
      "issues": [],
      "port": 8080,
      "reason": null,
      "valid": true
    }
  }
}
```

```json
{
  "input": {
    "kind": "check-loopback-bind",
    "value": {
      "host": "0.0.0.0",
      "port": 8080
    }
  },
  "output": {
    "kind": "check-loopback-bind",
    "ok": true,
    "value": {
      "allowed": false,
      "host": "0.0.0.0",
      "issues": [],
      "port": 8080,
      "reason": "non-loopback-host",
      "valid": true
    }
  }
}
```

```json
{
  "input": {
    "kind": "check-loopback-bind",
    "value": {
      "host": {
        "x": 1
      },
      "port": 8080
    }
  },
  "output": {
    "kind": "check-loopback-bind",
    "ok": true,
    "value": {
      "allowed": false,
      "host": null,
      "issues": [
        "bad-host"
      ],
      "port": 8080,
      "reason": null,
      "valid": false
    }
  }
}
```

Public regression tests: `test/community_wildbound_loopback_bind_guard.test.js`.


<!-- community-core:wildbound-npm-script-guard -->
### Wildbound Npm Script Guard

Gives contributors to the code-only local browser game a tiny deterministic checker for the documented check, test and start script names so script allowlisting can be unit-tested as pure JSON without toolchain, server, storage, SDK, network, sound or rendering.

Reusable deterministic JSON core: `js/community/wildbound_npm_script_guard.mjs`, API `runFeature(payload)`. This module is independently tested; application/UI integration is outside this change.

Exposes runFeature(payload) as the sole required entry point; optional pure helpers checkNpmScript and checkNpmScriptBatch may be exposed. Input payload must be a plain JSON object with string field kind equal to check-npm-script or check-npm-script-batch and a value field. For check-npm-script value must be a plain object with exactly key script. script must be string length 1 to 32 where each character verified with for-of is A-Z, a-z, hyphen or underscore. When well-formed return ok true with kind echo and value holding alphabetically ordered allowed, issues, reason, script and valid. script echoes input; valid true with issues empty; allowed true with reason null only when script equals check or test or start else allowed false with reason unknown-script. When script malformed return ok true with kind echo and value holding same five keys where valid false, allowed false, reason null, script echoes when string else null, and issues holding single bad-script. For check-npm-script-batch value must be a plain object with exactly key requests holding array length 0 to 16 where each element is a npm-script value object as above; each evaluated independently in order with for-of and results collected with push; success returns ok true with kind check-npm-script-batch and value holding results array where each result holds the five ordered keys above. Invalid kind or non-object payload or malformed value returns ok false with kind unknown when kind missing or unknown else input kind plus value null plus issues array holding one reason among bad-kind, bad-payload, bad-value and bad-requests. All operations use for-of over Object entries and string characters, build objects with object literals and Object.fromEntries and arrays with push, preserve input, order keys alphabetically at every level, builtins never aliased or passed as callbacks, computed access only for literal nonnegative numeric indices, no prototype or constructor access, no reassignment or property mutation, and are pure deterministic JSON to JSON with no input output, environment access, Date, time, randomness, callbacks or external packages. Mirrors only the documented local check, test and start script names and never performs toolchain execution, server, storage, SDK, leaderboard, network, sound or rendering.

Examples (JSON input and expected output):

```json
{
  "input": {
    "kind": "check-npm-script",
    "value": {
      "script": "check"
    }
  },
  "output": {
    "kind": "check-npm-script",
    "ok": true,
    "value": {
      "allowed": true,
      "issues": [],
      "reason": null,
      "script": "check",
      "valid": true
    }
  }
}
```

```json
{
  "input": {
    "kind": "check-npm-script",
    "value": {
      "script": "deploy"
    }
  },
  "output": {
    "kind": "check-npm-script",
    "ok": true,
    "value": {
      "allowed": false,
      "issues": [],
      "reason": "unknown-script",
      "script": "deploy",
      "valid": true
    }
  }
}
```

```json
{
  "input": {
    "kind": "check-npm-script",
    "value": {
      "script": {
        "x": 1
      }
    }
  },
  "output": {
    "kind": "check-npm-script",
    "ok": true,
    "value": {
      "allowed": false,
      "issues": [
        "bad-script"
      ],
      "reason": null,
      "script": null,
      "valid": false
    }
  }
}
```

Public regression tests: `test/community_wildbound_npm_script_guard.test.js`.


<!-- community-core:wildbound-leaderboard-submit-guard -->
### Wildbound Leaderboard Submit Guard

Gives contributors to the code-only local browser game a tiny deterministic checker for the documented leaderboard-not-configured local fallback so SDK submit gating decisions can be unit-tested as pure JSON without SDK, network, storage, sound or rendering.

Reusable deterministic JSON core: `js/community/wildbound_leaderboard_submit_guard.mjs`, API `runFeature(payload)`. This module is independently tested; application/UI integration is outside this change.

Exposes runFeature(payload) as the sole required entry point; optional pure helpers checkLeaderboardSubmit and checkLeaderboardSubmitBatch may be exposed. Input payload must be a plain JSON object with string field kind equal to check-leaderboard-submit or check-leaderboard-submit-batch and a value field. For check-leaderboard-submit value must be a plain object with exactly keys hasKey, hasSubmitApi and usingCrazyGames. hasKey must be boolean, hasSubmitApi must be boolean, usingCrazyGames must be boolean. When well-formed return ok true with kind echo and value holding alphabetically ordered hasKey, hasSubmitApi, issues, reason, submitted, usingCrazyGames and valid. hasKey, hasSubmitApi and usingCrazyGames echo input; valid true with issues empty; submitted true with reason null only when hasKey true and hasSubmitApi true and usingCrazyGames true else submitted false with reason leaderboard-not-configured. When any field malformed return ok true with kind echo and value holding same seven keys where valid false, submitted false, reason null, hasKey echoes when boolean else null, hasSubmitApi echoes when boolean else null, usingCrazyGames echoes when boolean else null, and issues holds one or more of bad-key-flag, bad-api-flag and bad-sdk-flag in that deterministic order. For check-leaderboard-submit-batch value must be a plain object with exactly key requests holding array length 0 to 16 where each element is a leaderboard-submit value object as above; each evaluated independently in order with for-of and results collected with push; success returns ok true with kind check-leaderboard-submit-batch and value holding results array where each result holds the seven ordered keys above. Invalid kind or non-object payload or malformed value returns ok false with kind unknown when kind missing or unknown else input kind plus value null plus issues array holding one reason among bad-kind, bad-payload, bad-value and bad-requests. All operations use for-of over Object entries and string characters, build objects with object literals and Object.fromEntries and arrays with push, preserve input, order keys alphabetically at every level, builtins never aliased or passed as callbacks, computed access only for literal nonnegative numeric indices, no prototype or constructor access, no reassignment or property mutation, and are pure deterministic JSON to JSON with no input output, environment access, Date, time, randomness, callbacks or external packages. Mirrors only the documented local fallback when SDK submit API or leaderboard key is missing and never performs network, storage, SDK, leaderboard submission, sound or rendering.

Examples (JSON input and expected output):

```json
{
  "input": {
    "kind": "check-leaderboard-submit",
    "value": {
      "hasKey": true,
      "hasSubmitApi": true,
      "usingCrazyGames": true
    }
  },
  "output": {
    "kind": "check-leaderboard-submit",
    "ok": true,
    "value": {
      "hasKey": true,
      "hasSubmitApi": true,
      "issues": [],
      "reason": null,
      "submitted": true,
      "usingCrazyGames": true,
      "valid": true
    }
  }
}
```

```json
{
  "input": {
    "kind": "check-leaderboard-submit",
    "value": {
      "hasKey": true,
      "hasSubmitApi": true,
      "usingCrazyGames": false
    }
  },
  "output": {
    "kind": "check-leaderboard-submit",
    "ok": true,
    "value": {
      "hasKey": true,
      "hasSubmitApi": true,
      "issues": [],
      "reason": "leaderboard-not-configured",
      "submitted": false,
      "usingCrazyGames": false,
      "valid": true
    }
  }
}
```

```json
{
  "input": {
    "kind": "check-leaderboard-submit",
    "value": {
      "hasKey": true,
      "hasSubmitApi": true,
      "usingCrazyGames": {
        "x": 1
      }
    }
  },
  "output": {
    "kind": "check-leaderboard-submit",
    "ok": true,
    "value": {
      "hasKey": true,
      "hasSubmitApi": true,
      "issues": [
        "bad-sdk-flag"
      ],
      "reason": null,
      "submitted": false,
      "usingCrazyGames": null,
      "valid": false
    }
  }
}
```

Public regression tests: `test/community_wildbound_leaderboard_submit_guard.test.js`.
