/**
 * Minimal mock API for local development – zero dependencies.
 *
 *   POST /signups  → 200 { ok: true, id, ...payload }   (persisted to mock/db.json)
 *   GET  /signups  → 200 [ ...signups ]
 *
 * Reached from the Angular dev server via proxy.conf.json (/api/* → :3000/*).
 */
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PORT = Number(process.env['MOCK_PORT'] ?? 3000);
const DB_PATH = process.env['MOCK_DB_PATH'] ?? join(dirname(fileURLToPath(import.meta.url)), 'db.json');

const readDb = async () => JSON.parse(await readFile(DB_PATH, 'utf8'));
const writeDb = (db) => writeFile(DB_PATH, JSON.stringify(db, null, 2) + '\n');

const send = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
};

const readJson = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });

// Serialize read-modify-write operations so simultaneous signups are not lost.
let pendingWrite = Promise.resolve();

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (req.method === 'OPTIONS') return send(res, 204);

    if (path === '/signups' && req.method === 'GET') {
      const db = await readDb();
      return send(res, 200, db.signups);
    }

    if (path === '/signups' && req.method === 'POST') {
      let payload;
      try {
        payload = await readJson(req);
      } catch {
        return send(res, 400, { ok: false, error: 'Invalid JSON' });
      }
      if (
        !payload ||
        typeof payload !== 'object' ||
        Array.isArray(payload) ||
        ['firstName', 'lastName', 'email'].some(
          (key) => typeof payload[key] !== 'string' || !payload[key].trim(),
        )
      ) {
        return send(res, 400, { ok: false, error: 'First name, last name and email are required' });
      }
      const record = { ...payload, id: randomUUID(), receivedAt: new Date().toISOString() };
      const save = pendingWrite.then(async () => {
        const db = await readDb();
        db.signups.push(record);
        await writeDb(db);
      });
      pendingWrite = save.catch(() => {});
      await save;
      return send(res, 200, { ...record, ok: true });
    }

    send(res, 404, { ok: false, error: 'Not found' });
  } catch {
    send(res, 500, { ok: false, error: 'Unable to save signup. Please try again.' });
  }
}).listen(PORT, '127.0.0.1', function () {
  console.log(`[mock] listening on http://127.0.0.1:${this.address().port}`);
});
