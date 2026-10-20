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
