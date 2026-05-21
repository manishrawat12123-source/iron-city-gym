const express = require('express');
const jwt = require('jsonwebtoken');
const { db, mapUserForAdmin, persistMembersToJson } = require('./db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ironcity_super_secret_key';
const ADMIN_EMAIL = 'manishwamu321@gmail.com';

const isAdminMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

router.use(isAdminMiddleware);

router.get('/users', async (req, res) => {
  try {
    const rows = await db.all(
      'SELECT id, name, email, plan, createdAt, workoutPlan, preferences FROM users ORDER BY id'
    );
    const users = rows.map(mapUserForAdmin);
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to load users' });
  }
});

router.put('/user/:userId/plan', async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.params.userId;
    const normalized = plan ? String(plan).toLowerCase() : 'basic';
    await db.run('UPDATE users SET plan = ? WHERE id = ?', [normalized, userId]);
    persistMembersToJson();
    const row = await db.get(
      'SELECT id, name, email, plan, createdAt, workoutPlan, preferences FROM users WHERE id = ?',
      [userId]
    );
    if (!row) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: mapUserForAdmin(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update plan' });
  }
});

router.post('/user/:userId/diet-plan', async (req, res) => {
  try {
    const { title, calories, protein, carbs, fat, mealPlan, notes } = req.body;
    const userId = req.params.userId;
    await db.run(
      `INSERT INTO diet_plans (userId, title, calories, protein, carbs, fat, mealPlan, notes, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(userId) DO UPDATE SET
         title = excluded.title,
         calories = excluded.calories,
         protein = excluded.protein,
         carbs = excluded.carbs,
         fat = excluded.fat,
         mealPlan = excluded.mealPlan,
         notes = excluded.notes,
         updatedAt = datetime('now')`,
      [userId, title, calories, protein, carbs, fat, mealPlan, notes]
    );
    persistMembersToJson();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to save diet plan' });
  }
});

router.get('/user/:userId/diet-plan', async (req, res) => {
  try {
    const plan = await db.get('SELECT * FROM diet_plans WHERE userId = ?', [req.params.userId]);
    res.json({ success: true, dietPlan: plan || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to load diet plan' });
  }
});

router.put('/user/:userId/workout-plan', async (req, res) => {
  try {
    const workoutPlan = req.body.workoutPlan || req.body.updatedPlan;
    await db.run('UPDATE users SET workoutPlan = ? WHERE id = ?', [
      JSON.stringify(workoutPlan),
      req.params.userId,
    ]);
    persistMembersToJson();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to save workout plan' });
  }
});

router.post('/user/:userId/progress', async (req, res) => {
  try {
    const { weight, bodyFat, chest, waist, arms, note, date } = req.body;
    const userId = req.params.userId;
    await db.run(
      `INSERT INTO progress (userId, weight, bodyFat, chest, waist, arms, note, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        weight,
        bodyFat,
        chest,
        waist,
        arms,
        note,
        date || new Date().toISOString().split('T')[0],
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to save progress' });
  }
});

router.get('/progress/all', async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT u.id as userId, u.name, u.email, u.plan,
        (SELECT date FROM progress WHERE userId = u.id ORDER BY date DESC, id DESC LIMIT 1) as lastUpdated,
        (SELECT weight FROM progress WHERE userId = u.id ORDER BY date DESC, id DESC LIMIT 1) as weight,
        (SELECT bodyFat FROM progress WHERE userId = u.id ORDER BY date DESC, id DESC LIMIT 1) as bodyFat
      FROM users u
      ORDER BY u.name
    `);
    const progress = rows.map((r) => ({
      userId: r.userId,
      name: r.name,
      email: r.email,
      plan: r.plan || 'basic',
      lastUpdated: r.lastUpdated || 'Never',
      weight: r.weight != null ? r.weight : '-',
      bodyFat: r.bodyFat != null ? r.bodyFat : '-',
    }));
    res.json({ success: true, progress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to load progress' });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT n.id, n.message, n.type, n.createdAt, n.userId, u.email, u.name
      FROM notifications n
      LEFT JOIN users u ON n.userId = u.id
      ORDER BY n.createdAt DESC
      LIMIT 100
    `);
    const notifications = rows.map((n) => ({
      id: n.id,
      message: n.message,
      type: n.type,
      date: n.createdAt,
      targetEmail: n.userId ? n.email : 'all',
      userId: n.userId,
    }));
    res.json({ success: true, notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to load notifications' });
  }
});

router.post('/notifications/send', async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    if (userId === 'all') {
      const users = await db.all('SELECT id FROM users');
      for (const user of users) {
        await db.run(
          `INSERT INTO notifications (userId, message, type, read, createdAt)
           VALUES (?, ?, ?, 0, datetime('now'))`,
          [user.id, message, type || 'info']
        );
      }
    } else {
      await db.run(
        `INSERT INTO notifications (userId, message, type, read, createdAt)
         VALUES (?, ?, ?, 0, datetime('now'))`,
        [userId, message, type || 'info']
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

module.exports = router;
