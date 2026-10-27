import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('mock returns real HTTP 200, persists future answers, and handles failures', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'signup-test-'));
  const db = join(dir, 'db.json');
  await writeFile(db, '{"signups":[]}');
  const child = spawn(process.execPath, ['mock/server.mjs'], {
    env: { ...process.env, MOCK_PORT: '0', MOCK_DB_PATH: db },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    // The server logs its actual bound port for ephemeral-port testing.
    const [output] = await once(child.stdout, 'data');
    const port = output.toString().match(/:(\d+)/)[1];
    const url = `http://127.0.0.1:${port}/signups`;
    const post = (body) => fetch(url, { method: 'POST', body: JSON.stringify(body) });
    const payload = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', company: 'Example' };
    const results = await Promise.all([post(payload), post(payload)]);
    assert.deepEqual(
      results.map((r) => r.status),
      [200, 200],
    );
    const body = await results[0].json();
    assert.equal(body.ok, true);
    assert.equal(body.company, 'Example');
    assert.equal(JSON.parse(await readFile(db, 'utf8')).signups.length, 2);
    assert.equal((await post(null)).status, 400);
    assert.equal((await post({})).status, 400);
    assert.equal((await fetch(url, { method: 'POST', body: '{' })).status, 400);
    assert.equal((await fetch(url)).status, 200);
    assert.equal((await fetch(url + '/missing')).status, 404);
    await writeFile(db, 'broken');
    assert.equal((await post(payload)).status, 500);
    await writeFile(db, '{"signups":[]}');
    assert.equal((await post(payload)).status, 200);
  } finally {
    child.kill();
    await once(child, 'exit');
    await rm(dir, { recursive: true, force: true });
  }
});
