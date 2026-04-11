const express = require('express');
const initSqlJs = require('sql.js');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const SHRED_PASS = process.env.SHRED_PASS; // kept for backward compat during migration
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const DB_PATH = path.join(__dirname, 'shred.db');

// --- Middleware ---
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: [
    'https://creative.kyleferguson.studio',
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// --- Database (sql.js — pure WASM, no native deps) ---
let db;

function save() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function getAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function getOne(sql, params = []) {
  const rows = getAll(sql, params);
  return rows[0] || null;
}

function run(sql, params = []) {
  db.run(sql, params);
  const lastId = db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0];
  const changes = db.getRowsModified();
  save();
  return { lastId, changes };
}

// --- JWT helpers ---
function signAccess(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
}
function signRefresh(user) {
  return jwt.sign({ id: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
}

// --- Rate limiting ---
const loginAttempts = new Map() // ip -> { count, resetAt }
const AI_RATE = new Map()       // userId -> { count, resetAt }
const LOGIN_WINDOW = 15 * 60 * 1000 // 15 min
const LOGIN_MAX = 10                  // max attempts per window
const AI_WINDOW = 60 * 1000          // 1 min
const AI_MAX = 10                     // max AI calls per minute per user

function checkLoginRate(ip) {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW })
    return true
  }
  entry.count++
  return entry.count <= LOGIN_MAX
}

function checkAIRate(userId) {
  const now = Date.now()
  const entry = AI_RATE.get(userId)
  if (!entry || now > entry.resetAt) {
    AI_RATE.set(userId, { count: 1, resetAt: now + AI_WINDOW })
    return true
  }
  entry.count++
  return entry.count <= AI_MAX
}

// --- Auth middleware ---
// JWT Bearer token only — legacy x-auth removed
function authMiddleware(req, res, next) {
  if (req.method === 'OPTIONS') return next();

  const pub = ['/auth/login', '/auth/signup', '/auth/refresh'];
  if (pub.includes(req.path)) return next();

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), JWT_SECRET);
      if (payload.type === 'refresh') return res.status(401).json({ error: 'use access token, not refresh' });
      req.user = { id: payload.id, username: payload.username, role: payload.role };
      return next();
    } catch (e) {
      return res.status(401).json({ error: 'token expired or invalid' });
    }
  }

  res.status(401).json({ error: 'unauthorized' });
}
app.use(authMiddleware);

// --- Admin guard ---
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin only' });
  next();
}

// --- Database init ---
async function initDB() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  // --- Users & auth tables ---
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    onboarding_complete INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS invite_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    created_by INTEGER REFERENCES users(id),
    used_by INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    used_at TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    cal_target INTEGER NOT NULL DEFAULT 2500,
    pro_target INTEGER NOT NULL DEFAULT 150,
    fiber_target INTEGER NOT NULL DEFAULT 25,
    goals TEXT NOT NULL DEFAULT '[]',
    focus_muscles TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // --- Existing tables (add user_id if missing) ---
  db.run(`CREATE TABLE IF NOT EXISTS food_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date TEXT NOT NULL,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein REAL NOT NULL,
    fiber REAL NOT NULL DEFAULT 0,
    carbs REAL NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'manual',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_food_date ON food_entries(date)`);
  // Add user_id column if table already existed without it
  try { db.run('ALTER TABLE food_entries ADD COLUMN user_id INTEGER'); } catch {}
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_food_user ON food_entries(user_id)`); } catch {}

  db.run(`CREATE TABLE IF NOT EXISTS saved_meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein REAL NOT NULL,
    fiber REAL NOT NULL DEFAULT 0,
    carbs REAL NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  try { db.run('ALTER TABLE saved_meals ADD COLUMN user_id INTEGER'); } catch {}

  db.run(`CREATE TABLE IF NOT EXISTS weight_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date TEXT NOT NULL,
    weight_lbs REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, date)
  )`);
  try { db.run('ALTER TABLE weight_log ADD COLUMN user_id INTEGER'); } catch {}
  // SQLite can't add UNIQUE constraint after the fact, but new inserts will use the compound check

  // --- Training tables ---
  db.run(`CREATE TABLE IF NOT EXISTS training_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    plan_json TEXT NOT NULL,
    muscles_json TEXT NOT NULL DEFAULT '[]',
    generated_from TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_plans_user ON training_plans(user_id)`);

  db.run(`CREATE TABLE IF NOT EXISTS training_state (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    state_json TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // --- Onboarding ---
  db.run(`CREATE TABLE IF NOT EXISTS onboarding_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    experience TEXT NOT NULL DEFAULT 'beginner',
    goals TEXT NOT NULL DEFAULT '[]',
    days_per_week INTEGER NOT NULL DEFAULT 4,
    equipment TEXT NOT NULL DEFAULT 'full_gym',
    injuries TEXT,
    priority_muscles TEXT NOT NULL DEFAULT '[]',
    height_in REAL,
    weight_lbs REAL,
    age INTEGER,
    cal_target INTEGER,
    pro_target INTEGER,
    dietary_restrictions TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // --- Migration: seed admin user if none exists ---
  const adminExists = getOne('SELECT id FROM users WHERE role = ?', ['admin']);
  if (!adminExists && SHRED_PASS) {
    const hash = bcrypt.hashSync(SHRED_PASS, 10);
    const { lastId } = run('INSERT INTO users (username, display_name, password_hash, role, onboarding_complete) VALUES (?, ?, ?, ?, ?)',
      ['kyle', 'Kyle', hash, 'admin', 1]);
    // Backfill existing data to admin user
    run('UPDATE food_entries SET user_id = ? WHERE user_id IS NULL', [lastId]);
    run('UPDATE saved_meals SET user_id = ? WHERE user_id IS NULL', [lastId]);
    run('UPDATE weight_log SET user_id = ? WHERE user_id IS NULL', [lastId]);
    // Create settings for admin
    run('INSERT OR IGNORE INTO user_settings (user_id, cal_target, pro_target, fiber_target, goals, focus_muscles) VALUES (?, ?, ?, ?, ?, ?)',
      [lastId, 3300, 200, 25, '["Build muscle","Lose fat"]', '["Chest","Back","Quads"]']);
    // Generate a few invite codes
    for (let i = 0; i < 5; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      run('INSERT INTO invite_codes (code, created_by) VALUES (?, ?)', [code, lastId]);
    }
    console.log('Admin user "kyle" created, existing data backfilled.');
  }

  // Seed default saved meals for new DB only (no existing meals and no users yet)
  const mealCount = getOne('SELECT COUNT(*) as c FROM saved_meals');
  const userCount = getOne('SELECT COUNT(*) as c FROM users');
  if (mealCount.c === 0 && userCount.c <= 1) {
    const admin = getOne('SELECT id FROM users WHERE role = ?', ['admin']);
    const uid = admin ? admin.id : null;
    const ins = 'INSERT INTO saved_meals (user_id, name, calories, protein, fiber, carbs, notes) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.run(ins, [uid, 'Morning Shake', 450, 60, 2, 30, '2 scoops protein powder + 2 cups unsweetened almond milk + \u00bd cup full-fat Greek yogurt']);
    db.run(ins, [uid, 'Tasty Bite Channa Masala (full pouch)', 340, 14, 8, 44, null]);
    db.run(ins, [uid, 'String cheese (1 stick)', 80, 7, 0, 1, null]);
    db.run(ins, [uid, 'Protein shake (1 scoop + water)', 140, 24, 0, 3, null]);
    save();
  }

  save();
}

// ===================== AUTH ROUTES =====================

app.post('/auth/signup', (req, res) => {
  const { username, display_name, password, invite_code } = req.body;
  if (!username || !password || !invite_code) return res.status(400).json({ error: 'username, password, invite_code required' });
  if (!display_name) return res.status(400).json({ error: 'display_name required' });
  if (username.length < 3) return res.status(400).json({ error: 'username must be at least 3 characters' });
  if (password.length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' });

  // Atomic invite code claim — UPDATE returns changes=0 if already used (race-safe)
  const { changes: claimed } = run(
    'UPDATE invite_codes SET used_by = -1, used_at = datetime(\'now\') WHERE code = ? AND used_by IS NULL',
    [invite_code.toUpperCase()]
  );
  if (!claimed) return res.status(400).json({ error: 'invalid or already used invite code' });

  const code = getOne('SELECT * FROM invite_codes WHERE code = ?', [invite_code.toUpperCase()]);

  // Check username not taken
  if (getOne('SELECT id FROM users WHERE username = ?', [username.toLowerCase()])) {
    // Release the invite code since signup failed
    run('UPDATE invite_codes SET used_by = NULL, used_at = NULL WHERE id = ?', [code.id]);
    return res.status(400).json({ error: 'username taken' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const { lastId } = run('INSERT INTO users (username, display_name, password_hash, role, onboarding_complete) VALUES (?, ?, ?, ?, ?)',
    [username.toLowerCase(), display_name, hash, 'user', 0]);

  // Assign the invite code to the actual user
  run('UPDATE invite_codes SET used_by = ? WHERE id = ?', [lastId, code.id]);

  // Create default settings
  run('INSERT INTO user_settings (user_id) VALUES (?)', [lastId]);

  const user = { id: lastId, username: username.toLowerCase(), role: 'user' };
  res.status(201).json({
    access_token: signAccess(user),
    refresh_token: signRefresh(user),
    user: { ...user, display_name, onboarding_complete: 0 },
  });
});

app.post('/auth/login', (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  if (!checkLoginRate(ip)) {
    return res.status(429).json({ error: 'too many login attempts, try again in 15 minutes' });
  }

  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const user = getOne('SELECT * FROM users WHERE username = ?', [username.toLowerCase()]);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  res.json({
    access_token: signAccess(user),
    refresh_token: signRefresh(user),
    user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role, onboarding_complete: user.onboarding_complete },
  });
});

app.post('/auth/refresh', (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token required' });
  try {
    const payload = jwt.verify(refresh_token, JWT_SECRET);
    if (payload.type !== 'refresh') return res.status(400).json({ error: 'not a refresh token' });
    const user = getOne('SELECT * FROM users WHERE id = ?', [payload.id]);
    if (!user) return res.status(401).json({ error: 'user not found' });
    res.json({
      access_token: signAccess(user),
      refresh_token: signRefresh(user),
    });
  } catch {
    res.status(401).json({ error: 'invalid refresh token' });
  }
});

app.get('/auth/me', (req, res) => {
  const user = getOne('SELECT id, username, display_name, role, onboarding_complete FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json(user);
});

// ===================== SETTINGS =====================

app.get('/settings', (req, res) => {
  let settings = getOne('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
  if (!settings) {
    run('INSERT INTO user_settings (user_id) VALUES (?)', [req.user.id]);
    settings = getOne('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
  }
  res.json({
    calTarget: settings.cal_target,
    proTarget: settings.pro_target,
    fiberTarget: settings.fiber_target,
    goals: JSON.parse(settings.goals || '[]'),
    focusMuscles: JSON.parse(settings.focus_muscles || '[]'),
  });
});

app.put('/settings', (req, res) => {
  const { calTarget, proTarget, fiberTarget, goals, focusMuscles } = req.body;
  let existing = getOne('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
  if (!existing) {
    run('INSERT INTO user_settings (user_id) VALUES (?)', [req.user.id]);
    existing = getOne('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
  }
  run('UPDATE user_settings SET cal_target=?, pro_target=?, fiber_target=?, goals=?, focus_muscles=?, updated_at=datetime(\'now\') WHERE user_id=?', [
    calTarget ?? existing.cal_target,
    proTarget ?? existing.pro_target,
    fiberTarget ?? existing.fiber_target,
    JSON.stringify(goals ?? JSON.parse(existing.goals || '[]')),
    JSON.stringify(focusMuscles ?? JSON.parse(existing.focus_muscles || '[]')),
    req.user.id,
  ]);
  res.json({ ok: true });
});

// ===================== FOOD ENTRIES (user-scoped) =====================

app.get('/entries', (req, res) => {
  const date = req.query.date || new Date().toLocaleDateString('en-CA');
  const uid = req.user.id;
  const entries = getAll('SELECT * FROM food_entries WHERE date = ? AND user_id = ? ORDER BY created_at ASC', [date, uid]);
  const totals = getOne('SELECT COALESCE(SUM(calories),0) as calories, COALESCE(SUM(protein),0) as protein, COALESCE(SUM(fiber),0) as fiber, COALESCE(SUM(carbs),0) as carbs FROM food_entries WHERE date = ? AND user_id = ?', [date, uid]);
  res.json({ entries, totals });
});

app.post('/entries', (req, res) => {
  const { name, calories, protein, fiber = 0, carbs = 0, source = 'manual', date } = req.body;
  if (!name || calories == null || protein == null) return res.status(400).json({ error: 'name, calories, protein required' });
  const d = date || new Date().toLocaleDateString('en-CA');
  const { lastId } = run('INSERT INTO food_entries (user_id, date, name, calories, protein, fiber, carbs, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [req.user.id, d, name, calories, protein, fiber, carbs, source]);
  res.status(201).json(getOne('SELECT * FROM food_entries WHERE id = ?', [lastId]));
});

app.put('/entries/:id', (req, res) => {
  const { name, calories, protein, fiber, carbs } = req.body;
  const existing = getOne('SELECT * FROM food_entries WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!existing) return res.status(404).json({ error: 'not found' });
  run('UPDATE food_entries SET name=?, calories=?, protein=?, fiber=?, carbs=? WHERE id=?', [
    name ?? existing.name, calories ?? existing.calories, protein ?? existing.protein,
    fiber ?? existing.fiber, carbs ?? existing.carbs, req.params.id
  ]);
  res.json(getOne('SELECT * FROM food_entries WHERE id = ?', [req.params.id]));
});

app.delete('/entries/:id', (req, res) => {
  const { changes } = run('DELETE FROM food_entries WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (changes === 0) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

// ===================== SAVED MEALS (user-scoped) =====================

app.get('/saved-meals', (req, res) => {
  res.json(getAll('SELECT * FROM saved_meals WHERE user_id = ? ORDER BY name ASC', [req.user.id]));
});

app.post('/saved-meals', (req, res) => {
  const { name, calories, protein, fiber = 0, carbs = 0, notes = null } = req.body;
  if (!name || calories == null || protein == null) return res.status(400).json({ error: 'name, calories, protein required' });
  const { lastId } = run('INSERT INTO saved_meals (user_id, name, calories, protein, fiber, carbs, notes) VALUES (?, ?, ?, ?, ?, ?, ?)', [req.user.id, name, calories, protein, fiber, carbs, notes]);
  res.status(201).json(getOne('SELECT * FROM saved_meals WHERE id = ?', [lastId]));
});

app.put('/saved-meals/:id', (req, res) => {
  const { name, calories, protein, fiber, carbs, notes } = req.body;
  const existing = getOne('SELECT * FROM saved_meals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!existing) return res.status(404).json({ error: 'not found' });
  run('UPDATE saved_meals SET name=?, calories=?, protein=?, fiber=?, carbs=?, notes=? WHERE id=?', [
    name ?? existing.name, calories ?? existing.calories, protein ?? existing.protein,
    fiber ?? existing.fiber, carbs ?? existing.carbs, notes ?? existing.notes, req.params.id
  ]);
  res.json(getOne('SELECT * FROM saved_meals WHERE id = ?', [req.params.id]));
});

app.delete('/saved-meals/:id', (req, res) => {
  const { changes } = run('DELETE FROM saved_meals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (changes === 0) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

// ===================== WEIGHT LOG (user-scoped) =====================

app.get('/weight', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  res.json(getAll('SELECT * FROM weight_log WHERE user_id = ? ORDER BY date DESC LIMIT ?', [req.user.id, days]));
});

app.post('/weight', (req, res) => {
  const { weight_lbs, date } = req.body;
  if (weight_lbs == null) return res.status(400).json({ error: 'weight_lbs required' });
  const d = date || new Date().toLocaleDateString('en-CA');
  // Use user-scoped upsert
  const existing = getOne('SELECT id FROM weight_log WHERE user_id = ? AND date = ?', [req.user.id, d]);
  if (existing) {
    run('UPDATE weight_log SET weight_lbs = ? WHERE id = ?', [weight_lbs, existing.id]);
  } else {
    run('INSERT INTO weight_log (user_id, date, weight_lbs) VALUES (?, ?, ?)', [req.user.id, d, weight_lbs]);
  }
  res.json(getOne('SELECT * FROM weight_log WHERE user_id = ? AND date = ?', [req.user.id, d]));
});

// ===================== HISTORY (user-scoped) =====================

app.get('/history', (req, res) => {
  const from = req.query.from;
  const to = req.query.to || new Date().toLocaleDateString('en-CA');
  const uid = req.user.id;
  if (from) {
    res.json(getAll('SELECT date, SUM(calories) as calories, SUM(protein) as protein, SUM(fiber) as fiber, SUM(carbs) as carbs, COUNT(*) as entry_count FROM food_entries WHERE date >= ? AND date <= ? AND user_id = ? GROUP BY date ORDER BY date DESC LIMIT 90', [from, to, uid]));
  } else {
    res.json(getAll('SELECT date, SUM(calories) as calories, SUM(protein) as protein, SUM(fiber) as fiber, SUM(carbs) as carbs, COUNT(*) as entry_count FROM food_entries WHERE date <= ? AND user_id = ? GROUP BY date ORDER BY date DESC LIMIT 90', [to, uid]));
  }
});

app.get('/history/weekly', (req, res) => {
  const date = req.query.date || new Date().toLocaleDateString('en-CA');
  const d = new Date(date + 'T00:00:00');
  const dayOfWeek = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const from = monday.toLocaleDateString('en-CA');
  const to = sunday.toLocaleDateString('en-CA');
  const uid = req.user.id;

  // Get user settings for targets
  const settings = getOne('SELECT * FROM user_settings WHERE user_id = ?', [uid]);
  const proTarget = settings ? settings.pro_target : 150;
  const calMin = settings ? Math.round(settings.cal_target * 0.94) : 3100;
  const calMax = settings ? Math.round(settings.cal_target * 1.06) : 3500;

  const days = getAll('SELECT date, SUM(calories) as calories, SUM(protein) as protein, SUM(fiber) as fiber, SUM(carbs) as carbs FROM food_entries WHERE date >= ? AND date <= ? AND user_id = ? GROUP BY date ORDER BY date ASC', [from, to, uid]);
  const count = days.length || 1;
  res.json({
    from, to, days,
    averages: {
      calories: Math.round(days.reduce((s, r) => s + r.calories, 0) / count),
      protein: Math.round(days.reduce((s, r) => s + r.protein, 0) / count),
      fiber: Math.round(days.reduce((s, r) => s + r.fiber, 0) / count),
      carbs: Math.round(days.reduce((s, r) => s + r.carbs, 0) / count)
    },
    protein_days_hit: days.filter(r => r.protein >= proTarget * 0.95).length,
    calorie_days_in_range: days.filter(r => r.calories >= calMin && r.calories <= calMax).length,
    total_days: count
  });
});

// ===================== TRAINING PLAN & STATE =====================

app.get('/training/plan', (req, res) => {
  const plan = getOne('SELECT * FROM training_plans WHERE user_id = ? AND active = 1 ORDER BY created_at DESC', [req.user.id]);
  if (!plan) return res.json({ plan: null, muscles: null });
  res.json({
    id: plan.id,
    plan: JSON.parse(plan.plan_json),
    muscles: JSON.parse(plan.muscles_json || '[]'),
    generated_from: plan.generated_from ? JSON.parse(plan.generated_from) : null,
    created_at: plan.created_at,
  });
});

app.post('/training/plan', (req, res) => {
  const { plan_json, muscles_json, generated_from } = req.body;
  if (!plan_json) return res.status(400).json({ error: 'plan_json required' });
  // Deactivate existing plans
  run('UPDATE training_plans SET active = 0 WHERE user_id = ?', [req.user.id]);
  const { lastId } = run('INSERT INTO training_plans (user_id, plan_json, muscles_json, generated_from, active) VALUES (?, ?, ?, ?, 1)', [
    req.user.id,
    typeof plan_json === 'string' ? plan_json : JSON.stringify(plan_json),
    typeof muscles_json === 'string' ? muscles_json : JSON.stringify(muscles_json || []),
    generated_from ? (typeof generated_from === 'string' ? generated_from : JSON.stringify(generated_from)) : null,
  ]);
  res.status(201).json({ id: lastId, ok: true });
});

app.get('/training/state', (req, res) => {
  const row = getOne('SELECT * FROM training_state WHERE user_id = ?', [req.user.id]);
  if (!row) return res.json({ state: null });
  res.json({ state: JSON.parse(row.state_json) });
});

app.put('/training/state', (req, res) => {
  const { state } = req.body;
  if (!state) return res.status(400).json({ error: 'state required' });
  const json = typeof state === 'string' ? state : JSON.stringify(state);
  const existing = getOne('SELECT user_id FROM training_state WHERE user_id = ?', [req.user.id]);
  if (existing) {
    run('UPDATE training_state SET state_json = ?, updated_at = datetime(\'now\') WHERE user_id = ?', [json, req.user.id]);
  } else {
    run('INSERT INTO training_state (user_id, state_json) VALUES (?, ?)', [req.user.id, json]);
  }
  res.json({ ok: true });
});

// ===================== ONBOARDING =====================

app.post('/onboarding', (req, res) => {
  const { experience, goals, days_per_week, equipment, injuries, priority_muscles, height_in, weight_lbs, age, cal_target, pro_target, dietary_restrictions } = req.body;
  if (!experience || !goals || !days_per_week || !equipment || !priority_muscles) {
    return res.status(400).json({ error: 'required fields: experience, goals, days_per_week, equipment, priority_muscles' });
  }

  const existing = getOne('SELECT user_id FROM onboarding_profiles WHERE user_id = ?', [req.user.id]);
  if (existing) {
    run(`UPDATE onboarding_profiles SET experience=?, goals=?, days_per_week=?, equipment=?, injuries=?, priority_muscles=?, height_in=?, weight_lbs=?, age=?, cal_target=?, pro_target=?, dietary_restrictions=?, updated_at=datetime('now') WHERE user_id=?`, [
      experience, JSON.stringify(goals), days_per_week, equipment, injuries || null,
      JSON.stringify(priority_muscles), height_in || null, weight_lbs || null, age || null,
      cal_target || 2500, pro_target || 150, dietary_restrictions || null, req.user.id,
    ]);
  } else {
    run(`INSERT INTO onboarding_profiles (user_id, experience, goals, days_per_week, equipment, injuries, priority_muscles, height_in, weight_lbs, age, cal_target, pro_target, dietary_restrictions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      req.user.id, experience, JSON.stringify(goals), days_per_week, equipment, injuries || null,
      JSON.stringify(priority_muscles), height_in || null, weight_lbs || null, age || null,
      cal_target || 2500, pro_target || 150, dietary_restrictions || null,
    ]);
  }

  // Update user settings from nutrition answers
  run('UPDATE user_settings SET cal_target=?, pro_target=?, goals=?, focus_muscles=?, updated_at=datetime(\'now\') WHERE user_id=?', [
    cal_target || 2500, pro_target || 150, JSON.stringify(goals), JSON.stringify(priority_muscles), req.user.id,
  ]);

  // Mark onboarding complete
  run('UPDATE users SET onboarding_complete = 1 WHERE id = ?', [req.user.id]);

  res.json({ ok: true });
});

app.get('/onboarding', (req, res) => {
  const profile = getOne('SELECT * FROM onboarding_profiles WHERE user_id = ?', [req.user.id]);
  if (!profile) return res.json(null);
  res.json({
    ...profile,
    goals: JSON.parse(profile.goals || '[]'),
    priority_muscles: JSON.parse(profile.priority_muscles || '[]'),
  });
});

// ===================== AI PLAN GENERATION =====================

app.post('/training/generate', async (req, res) => {
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'API key not configured' });
  if (!checkAIRate(req.user.id)) return res.status(429).json({ error: 'slow down — max 10 AI requests per minute' });

  const profile = getOne('SELECT * FROM onboarding_profiles WHERE user_id = ?', [req.user.id]);
  if (!profile) return res.status(400).json({ error: 'complete onboarding first' });

  const goals = JSON.parse(profile.goals || '[]');
  const priorityMuscles = JSON.parse(profile.priority_muscles || '[]');

  const systemPrompt = `You are an expert exercise scientist specializing in Renaissance Periodization (RP) training methodology. Generate a structured weekly training plan as a JSON array.

VOLUME FRAMEWORK (sets per week):
| Muscle | MEV | MAV Range | MRV |
|--------|-----|-----------|-----|
| Chest | 8 | 12-20 | 22 |
| Back | 8 | 12-20 | 22 |
| Quads | 6 | 10-18 | 20 |
| Hamstrings | 4 | 8-14 | 16 |
| Delts | 6 | 12-20 | 24 |
| Biceps | 4 | 10-18 | 22 |
| Triceps | 4 | 8-14 | 18 |
| Glutes | 0 | 4-12 | 16 |
| Calves | 6 | 10-16 | 20 |
| Abs | 0 | 6-14 | 20 |

RULES:
- Priority muscles start at mid-MAV range. Other muscles start at MEV or low-MAV.
- Total weekly sets per muscle must stay within MEV-MRV bounds.
- RIR (Reps In Reserve) progression within each exercise: start higher (3-4), end lower (1-2).
- The "rir" array length MUST equal the "sets" number for each exercise.
- Each exercise targets exactly one primary muscle group.
- Rest days have: { rest: true, exercises: [], muscles: [] }
- Training days have: { rest: false (or omitted), exercises: [...], muscles: [...] }

RESPONSE FORMAT — respond with ONLY a valid JSON array, no markdown, no explanation:
[
  { "label": "Monday", "title": "Push", "subtitle": "Chest focus", "muscles": ["Chest","Delts","Triceps"], "exercises": [
    { "name": "Incline DB Press", "muscle": "Chest", "sets": 4, "reps": "8-12", "rir": [3,2,2,1] },
    ...
  ]},
  { "label": "Tuesday", "title": "Rest", "subtitle": "Recovery", "rest": true, "muscles": [], "exercises": [] },
  ...
]

The array must have exactly 7 entries (Monday through Sunday).`;

  const userPrompt = `Create a training plan for this person:
- Experience: ${profile.experience}
- Goals: ${goals.join(', ')}
- Available days per week: ${profile.days_per_week}
- Equipment: ${profile.equipment.replace(/_/g, ' ')}
${profile.injuries ? `- Injuries/limitations: ${profile.injuries}` : ''}
- Priority muscles: ${priorityMuscles.join(', ')}
${profile.age ? `- Age: ${profile.age}` : ''}
${profile.weight_lbs ? `- Weight: ${profile.weight_lbs} lbs` : ''}

Generate the 7-day plan JSON array now.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      })
    });
    const data = await response.json();
    const raw = data.content?.[0]?.text || '';
    const plan = parseAIJSON(raw);

    if (!Array.isArray(plan) || plan.length !== 7) {
      return res.status(500).json({ error: 'AI generated an invalid plan structure', raw });
    }

    // Validate each day
    for (const day of plan) {
      if (!day.label || !day.title) return res.status(500).json({ error: 'missing label/title in plan day', raw });
      if (!day.rest && day.exercises) {
        for (const ex of day.exercises) {
          if (!ex.name || !ex.muscle || !ex.sets || !ex.reps || !ex.rir) {
            return res.status(500).json({ error: `invalid exercise: ${JSON.stringify(ex)}`, raw });
          }
          if (ex.rir.length !== ex.sets) {
            return res.status(500).json({ error: `rir length (${ex.rir.length}) != sets (${ex.sets}) for ${ex.name}`, raw });
          }
        }
      }
    }

    // Store plan
    run('UPDATE training_plans SET active = 0 WHERE user_id = ?', [req.user.id]);
    const { lastId } = run('INSERT INTO training_plans (user_id, plan_json, muscles_json, generated_from, active) VALUES (?, ?, ?, ?, 1)', [
      req.user.id, JSON.stringify(plan), '[]', JSON.stringify({
        experience: profile.experience, goals, days_per_week: profile.days_per_week,
        equipment: profile.equipment, priority_muscles: priorityMuscles,
      }),
    ]);

    // Reset training state for the new plan
    run('DELETE FROM training_state WHERE user_id = ?', [req.user.id]);

    res.json({ id: lastId, plan });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===================== ADMIN =====================

app.get('/admin/users', requireAdmin, (req, res) => {
  const users = getAll('SELECT u.id, u.username, u.display_name, u.role, u.onboarding_complete, u.created_at, o.experience, o.days_per_week FROM users u LEFT JOIN onboarding_profiles o ON u.id = o.user_id ORDER BY u.created_at DESC');
  res.json(users);
});

app.get('/admin/users/:id', requireAdmin, (req, res) => {
  const user = getOne('SELECT id, username, display_name, role, onboarding_complete, created_at FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'not found' });
  const profile = getOne('SELECT * FROM onboarding_profiles WHERE user_id = ?', [req.params.id]);
  const plan = getOne('SELECT id, created_at FROM training_plans WHERE user_id = ? AND active = 1', [req.params.id]);
  const settings = getOne('SELECT * FROM user_settings WHERE user_id = ?', [req.params.id]);
  res.json({
    ...user,
    profile: profile ? { ...profile, goals: JSON.parse(profile.goals || '[]'), priority_muscles: JSON.parse(profile.priority_muscles || '[]') } : null,
    plan: plan || null,
    settings: settings ? { calTarget: settings.cal_target, proTarget: settings.pro_target } : null,
  });
});

app.post('/admin/invite-codes', requireAdmin, (req, res) => {
  const count = Math.min(req.body.count || 1, 20);
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    run('INSERT INTO invite_codes (code, created_by) VALUES (?, ?)', [code, req.user.id]);
    codes.push(code);
  }
  res.status(201).json({ codes });
});

app.get('/admin/invite-codes', requireAdmin, (req, res) => {
  const codes = getAll('SELECT ic.*, u.username as used_by_username FROM invite_codes ic LEFT JOIN users u ON ic.used_by = u.id ORDER BY ic.created_at DESC');
  res.json(codes);
});

app.delete('/admin/users/:id', requireAdmin, (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'cannot delete yourself' });
  const { changes } = run('DELETE FROM users WHERE id = ? AND role != ?', [req.params.id, 'admin']);
  if (changes === 0) return res.status(404).json({ error: 'not found or cannot delete admin' });
  // Clean up user data
  run('DELETE FROM food_entries WHERE user_id = ?', [req.params.id]);
  run('DELETE FROM saved_meals WHERE user_id = ?', [req.params.id]);
  run('DELETE FROM weight_log WHERE user_id = ?', [req.params.id]);
  run('DELETE FROM training_plans WHERE user_id = ?', [req.params.id]);
  run('DELETE FROM training_state WHERE user_id = ?', [req.params.id]);
  run('DELETE FROM onboarding_profiles WHERE user_id = ?', [req.params.id]);
  run('DELETE FROM user_settings WHERE user_id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ===================== AI PROXIES =====================

app.post('/ai/photo', async (req, res) => {
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'API key not configured' });
  if (!checkAIRate(req.user.id)) return res.status(429).json({ error: 'slow down — max 10 AI requests per minute' });
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'image (base64) required' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            { type: 'text', text: 'Analyze this food photo. For each distinct food item visible, estimate:\n- Item name (be specific about portion size)\n- Calories\n- Protein (grams)\n- Fiber (grams)\n- Carbs (grams)\n\nRespond ONLY with a JSON array, no other text:\n[{"name": "...", "calories": N, "protein": N, "fiber": N, "carbs": N}]\n\nUse USDA nutrition database values when possible. Be realistic about portion sizes visible in the photo.' }
          ]
        }]
      })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    res.json({ items: parseAIJSON(text), raw: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/ai/estimate', async (req, res) => {
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'API key not configured' });
  if (!checkAIRate(req.user.id)) return res.status(429).json({ error: 'slow down — max 10 AI requests per minute' });
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: 'You are a precise nutrition database. Use USDA FoodData Central values when available. For restaurant items, use official published nutrition facts. For home-cooked items, calculate from individual ingredients. Never round to the nearest 50 or 100 — give your best specific estimate.',
        messages: [{
          role: 'user',
          content: `Estimate precise nutritional content for:\n"${text}"\n\nRespond ONLY with a JSON array:\n[{"name": "...", "calories": N, "protein": N, "fiber": N, "carbs": N}]\n\nUse standard serving size unless a specific portion is stated.`
        }]
      })
    });
    const data = await response.json();
    const raw = data.content?.[0]?.text || '';
    res.json({ items: parseAIJSON(raw), raw });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Allowed models and max tokens for coach — prevents abuse of API key
const ALLOWED_MODELS = ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6-20250514'];
const COACH_MAX_TOKENS = 2048;

app.post('/coach', async (req, res) => {
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'API key not configured' });

  // Rate limit AI calls per user
  if (!checkAIRate(req.user.id)) {
    return res.status(429).json({ error: 'slow down — max 10 AI requests per minute' });
  }

  // Validate and constrain the payload
  const { model, max_tokens, system, messages } = req.body;
  if (!model || !ALLOWED_MODELS.includes(model)) {
    return res.status(400).json({ error: `model must be one of: ${ALLOWED_MODELS.join(', ')}` });
  }
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  // Build a safe payload — only forward allowed fields
  const safePayload = {
    model,
    max_tokens: Math.min(Number(max_tokens) || 1024, COACH_MAX_TOKENS),
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  };
  if (system) safePayload.system = typeof system === 'string' ? system.slice(0, 2000) : '';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(safePayload)
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Helpers ---
function parseAIJSON(text) {
  try { return JSON.parse(text); } catch {}
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) try { return JSON.parse(match[1].trim()); } catch {}
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) try { return JSON.parse(arrMatch[0]); } catch {}
  return [];
}

// --- Start ---
initDB().then(() => {
  app.listen(PORT, () => console.log(`Shred proxy running on ${PORT}`));
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
