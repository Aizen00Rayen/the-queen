/* Where persistent data lives. It must survive redeploys, so by default it is OUTSIDE the
 * deployed app folder: ~/the-queen-data/{db,uploads}. Override with DATA_DIR / UPLOAD_DIR. */
const path = require('path');
const fs = require('fs');
const os = require('os');

function writable(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); fs.accessSync(dir, fs.constants.W_OK); return true; } catch { return false; }
}
const base = path.join(os.homedir(), 'the-queen-data');
const useHome = writable(base);

const DATA_DIR = process.env.DATA_DIR || (useHome ? path.join(base, 'db') : path.join(__dirname, 'data'));
const UPLOAD_DIR = process.env.UPLOAD_DIR || (useHome ? path.join(base, 'uploads') : path.join(__dirname, 'uploads'));
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
module.exports = { DATA_DIR, UPLOAD_DIR };
