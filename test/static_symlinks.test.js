import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const SECRET_FILE = 'SYNTHETIC-SYMLINK-SECRET-7f3a9c-file';
const SECRET_DIR = 'SYNTHETIC-SYMLINK-SECRET-7f3a9c-dirinner';
const REGULAR_JS = 'SYNTHETIC-REGULAR-JS-7f3a9c';
const REGULAR_CSS = 'SYNTHETIC-REGULAR-CSS-7f3a9c';

let fixtureDir = '';
let outsideDir = '';
let child = null;
let port = 0;
let serverLog = '';

function waitForPort(proc) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server start timeout: ' + serverLog)), 8000);
    proc.stdout.on('data', (chunk) => {
      serverLog += chunk.toString();
      const m = serverLog.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (m) {
        clearTimeout(timer);
        resolve(Number(m[1]));
      }
    });
    proc.stderr.on('data', (chunk) => {
      serverLog += chunk.toString();
    });
    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error('server exited early with code ' + code + ': ' + serverLog));
    });
  });
}

before(async () => {
  fixtureDir = await mkdtemp(join(tmpdir(), 'zanvoria-symlink-fixture-'));
  outsideDir = await mkdtemp(join(tmpdir(), 'zanvoria-symlink-outside-'));
  const serverSource = await readFile(join(repoRoot, 'server.js'), 'utf8');
  await writeFile(join(fixtureDir, 'server.js'), serverSource);
  await mkdir(join(fixtureDir, 'js'), { recursive: true });
  await mkdir(join(fixtureDir, 'css'), { recursive: true });
  await writeFile(join(fixtureDir, 'index.html'), '<!doctype html><title>synthetic</title>\n');
  await writeFile(join(fixtureDir, 'js', 'app.js'), `// ${REGULAR_JS}\nconsole.log('synthetic');\n`);
  await writeFile(join(fixtureDir, 'css', 'style.css'), `/* ${REGULAR_CSS} */\nbody{color:#000}\n`);
  await writeFile(join(outsideDir, 'secret.js'), `// ${SECRET_FILE}\nconsole.log('external');\n`);
  await mkdir(join(outsideDir, 'pubdir'), { recursive: true });
  await writeFile(join(outsideDir, 'pubdir', 'inner.js'), `// ${SECRET_DIR}\nconsole.log('external-inner');\n`);
  await symlink(join(outsideDir, 'secret.js'), join(fixtureDir, 'js', 'link.js'));
  await symlink(join(outsideDir, 'secret.js'), join(fixtureDir, 'css', 'link.css'));
  await symlink(join(outsideDir, 'pubdir'), join(fixtureDir, 'js', 'dirlink'));
  await symlink(join(outsideDir, 'pubdir'), join(fixtureDir, 'css', 'dirlink'));
  child = spawn(process.execPath, [join(fixtureDir, 'server.js')], {
    env: { PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  port = await waitForPort(child);
  assert.ok(Number.isInteger(port) && port > 0, 'ephemeral loopback port assigned');
});

after(async () => {
  if (child !== null) {
    child.kill();
    child = null;
  }
  if (fixtureDir) await rm(fixtureDir, { recursive: true, force: true });
  if (outsideDir) await rm(outsideDir, { recursive: true, force: true });
});

test('serves regular js file in synthetic fixture', async () => {
  const res = await fetch(`http://127.0.0.1:${port}/js/app.js`);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, new RegExp(REGULAR_JS));
  assert.doesNotMatch(body, new RegExp(SECRET_FILE));
});

test('serves regular css file in synthetic fixture', async () => {
  const res = await fetch(`http://127.0.0.1:${port}/css/style.css`);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, new RegExp(REGULAR_CSS));
});

test('GET js file symlink returns 404 without target', async () => {
  const res = await fetch(`http://127.0.0.1:${port}/js/link.js`);
  assert.equal(res.status, 404);
  const body = await res.text();
  assert.doesNotMatch(body, new RegExp(SECRET_FILE));
});

test('GET css file symlink returns 404 without target', async () => {
  const res = await fetch(`http://127.0.0.1:${port}/css/link.css`);
  assert.equal(res.status, 404);
  const body = await res.text();
  assert.doesNotMatch(body, new RegExp(SECRET_FILE));
});

test('GET through js directory symlink returns 404 without target', async () => {
  const res = await fetch(`http://127.0.0.1:${port}/js/dirlink/inner.js`);
  assert.equal(res.status, 404);
  const body = await res.text();
  assert.doesNotMatch(body, new RegExp(SECRET_DIR));
});

test('GET through css directory symlink returns 404 without target', async () => {
  const res = await fetch(`http://127.0.0.1:${port}/css/dirlink/inner.js`);
  assert.equal(res.status, 404);
  const body = await res.text();
  assert.doesNotMatch(body, new RegExp(SECRET_DIR));
});

test('HEAD file symlink returns 404', async () => {
  const res = await fetch(`http://127.0.0.1:${port}/js/link.js`, { method: 'HEAD' });
  assert.equal(res.status, 404);
});

test('HEAD through directory symlink returns 404', async () => {
  const res = await fetch(`http://127.0.0.1:${port}/js/dirlink/inner.js`, { method: 'HEAD' });
  assert.equal(res.status, 404);
});

test('HEAD regular file still succeeds', async () => {
  const res = await fetch(`http://127.0.0.1:${port}/js/app.js`, { method: 'HEAD' });
  assert.equal(res.status, 200);
});

test('keeps dotfile, traversal and write-method denials', async () => {
  const dot = await fetch(`http://127.0.0.1:${port}/.git/config`);
  assert.equal(dot.status, 404);
  const traversal = await fetch(`http://127.0.0.1:${port}/%2e%2e/%2e%2e/etc/passwd`);
  assert.equal(traversal.status, 404);
  const write = await fetch(`http://127.0.0.1:${port}/js/app.js`, { method: 'POST' });
  assert.equal(write.status, 405);
});
