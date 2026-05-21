const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'ironcity.db');
const MEMBERS_FILE = path.join(__dirname, 'members.json');
const PROGRESS_FILE = path.join(__dirname, 'progress.json');

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const ADMIN_EMAIL = 'manishwamu321@gmail.com';

function runSchema() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      plan TEXT DEFAULT 'basic',
      isAdmin INTEGER DEFAULT 0,
      workoutPlan TEXT,
      preferences TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS diet_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER UNIQUE,
      title TEXT,
      calories INTEGER,
      protein INTEGER,
      carbs INTEGER,
      fat INTEGER,
      mealPlan TEXT,
      notes TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      message TEXT,
      type TEXT DEFAULT 'info',
      read INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      weight REAL,
      bodyFat REAL,
      chest REAL,
      waist REAL,
      arms REAL,
      note TEXT,
      date TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const cols = sqlite.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (!cols.includes('plan')) {
    sqlite.exec("ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'basic'");
  }
  if (!cols.includes('isAdmin')) {
    sqlite.exec('ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0');
  }

  sqlite.prepare('UPDATE users SET isAdmin = 1 WHERE email = ?').run(ADMIN_EMAIL);
}

function parseJson(val, fallback = null) {
  if (val == null || val === '') return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function rowToMember(row) {
  if (!row) return null;
  const diet = sqlite.prepare('SELECT * FROM diet_plans WHERE userId = ?').get(row.id);
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    name: row.name,
    plan: row.plan || 'basic',
    isAdmin: row.isAdmin === 1,
    workoutPlan: parseJson(row.workoutPlan),
    preferences: parseJson(row.preferences),
    dietPlan: diet
      ? {
          title: diet.title,
          calories: diet.calories,
          protein: diet.protein,
          carbs: diet.carbs,
          fat: diet.fat,
          mealPlan: diet.mealPlan,
          notes: diet.notes,
        }
      : null,
  };
}

function migrateFromJson() {
  const count = sqlite.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count > 0) return;

  if (!fs.existsSync(MEMBERS_FILE)) return;

  const members = JSON.parse(fs.readFileSync(MEMBERS_FILE, 'utf8'));
  const insertUser = sqlite.prepare(`
    INSERT INTO users (id, email, password, name, plan, isAdmin, workoutPlan, preferences)
    VALUES (@id, @email, @password, @name, @plan, @isAdmin, @workoutPlan, @preferences)
  `);

  const insertDiet = sqlite.prepare(`
    INSERT INTO diet_plans (userId, title, calories, protein, carbs, fat, mealPlan, notes)
    VALUES (@userId, @title, @calories, @protein, @carbs, @fat, @mealPlan, @notes)
  `);

  for (const m of members) {
    const plan = (m.plan || 'basic').toLowerCase();
    const isAdmin = m.email === ADMIN_EMAIL || m.isAdmin ? 1 : 0;
    insertUser.run({
      id: m.id,
      email: m.email,
      password: m.password,
      name: m.name,
      plan,
      isAdmin,
      workoutPlan: m.workoutPlan ? JSON.stringify(m.workoutPlan) : null,
      preferences: m.preferences ? JSON.stringify(m.preferences) : null,
    });

    if (m.dietPlan) {
      insertDiet.run({
        userId: m.id,
        title: m.dietPlan.title || '',
        calories: m.dietPlan.calories || 0,
        protein: m.dietPlan.protein || 0,
        carbs: m.dietPlan.carbs || 0,
        fat: m.dietPlan.fat || 0,
        mealPlan: m.dietPlan.mealPlan || '',
        notes: m.dietPlan.notes || '',
      });
    }
  }

  if (fs.existsSync(PROGRESS_FILE)) {
    const progressData = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    const insertProgress = sqlite.prepare(`
      INSERT INTO progress (userId, weight, bodyFat, chest, waist, arms, note, date)
      VALUES (@userId, @weight, @bodyFat, @chest, @waist, @arms, @note, @date)
    `);
    for (const [email, entries] of Object.entries(progressData)) {
      const user = sqlite.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (!user) continue;
      for (const e of entries) {
        insertProgress.run({
          userId: user.id,
          weight: e.weight,
          bodyFat: e.bodyFat,
          chest: e.chest,
          waist: e.waist,
          arms: e.arms,
          note: e.note || '',
          date: e.date,
        });
      }
    }
  }
}

function initDatabase() {
  runSchema();
  migrateFromJson();
}

function getAllMembers() {
  const rows = sqlite.prepare('SELECT * FROM users ORDER BY id').all();
  return rows.map(rowToMember);
}

function getMemberById(id) {
  const row = sqlite.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return rowToMember(row);
}

function getMemberByEmail(email) {
  const row = sqlite.prepare('SELECT * FROM users WHERE email = ?').get(email);
  return rowToMember(row);
}

function persistMembersToJson() {
  const members = getAllMembers();
  fs.writeFileSync(MEMBERS_FILE, JSON.stringify(members, null, 2));
}

function mapUserForAdmin(row) {
  const diet = sqlite.prepare('SELECT id FROM diet_plans WHERE userId = ?').get(row.id);
  const hasWorkout = row.workoutPlan && row.workoutPlan !== 'null';
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    plan: row.plan || 'basic',
    createdAt: row.createdAt,
    planStatus: hasWorkout ? 'Assigned' : 'Not Assigned',
    dietStatus: diet ? 'Assigned' : 'Not Assigned',
    preferences: parseJson(row.preferences),
  };
}

const db = {
  all: (sql, params = []) => Promise.resolve(sqlite.prepare(sql).all(...params)),
  get: (sql, params = []) => Promise.resolve(sqlite.prepare(sql).get(...params)),
  run: (sql, params = []) => Promise.resolve(sqlite.prepare(sql).run(...params)),
};

function syncUserRecord(user) {
  sqlite
    .prepare(
      `UPDATE users SET plan = ?, workoutPlan = ?, preferences = ?, password = ?
       WHERE id = ?`
    )
    .run(
      user.plan || 'basic',
      user.workoutPlan ? JSON.stringify(user.workoutPlan) : null,
      user.preferences ? JSON.stringify(user.preferences) : null,
      user.password,
      user.id
    );
}

module.exports = {
  db,
  sqlite,
  initDatabase,
  getAllMembers,
  getMemberById,
  getMemberByEmail,
  persistMembersToJson,
  mapUserForAdmin,
  parseJson,
  syncUserRecord,
  ADMIN_EMAIL,
};
