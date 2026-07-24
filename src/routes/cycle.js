const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { computeCycleInfo } = require('../cycle');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MOODS = ['great', 'good', 'okay', 'low', 'irritable', 'sad'];

async function getUserId(telegramId) {
  const { rows } = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [telegramId]);
  return rows[0]?.id;
}

// GET /api/cycle/settings
router.get('/settings', async (req, res) => {
  try {
    const userId = await getUserId(req.telegramUser.id);
    if (!userId) return res.status(404).json({ error: 'Юзер не найден' });

    const { rows } = await pool.query('SELECT * FROM cycle_settings WHERE user_id = $1', [userId]);
    res.json(rows[0] || { user_id: userId, avg_cycle_length: 28, avg_period_length: 5 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/cycle/settings
router.put('/settings', async (req, res) => {
  const { avg_cycle_length, avg_period_length } = req.body;

  if (
    !Number.isInteger(avg_cycle_length) || avg_cycle_length < 15 || avg_cycle_length > 60 ||
    !Number.isInteger(avg_period_length) || avg_period_length < 1 || avg_period_length > 14
  ) {
    return res.status(400).json({ error: 'Некорректные значения цикла' });
  }

  try {
    const userId = await getUserId(req.telegramUser.id);
    if (!userId) return res.status(404).json({ error: 'Юзер не найден' });

    const { rows } = await pool.query(
      `INSERT INTO cycle_settings (user_id, avg_cycle_length, avg_period_length, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE SET avg_cycle_length = $2, avg_period_length = $3, updated_at = NOW()
       RETURNING *`,
      [userId, avg_cycle_length, avg_period_length]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/cycle/cycles — вся история циклов
router.get('/cycles', async (req, res) => {
  try {
    const userId = await getUserId(req.telegramUser.id);
    if (!userId) return res.status(404).json({ error: 'Юзер не найден' });

    const { rows } = await pool.query(
      'SELECT * FROM cycles WHERE user_id = $1 ORDER BY start_date DESC',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/cycle/cycles — отметить начало (и опционально конец) месячных
router.post('/cycles', async (req, res) => {
  const { start_date, end_date } = req.body;

  if (!DATE_RE.test(start_date)) return res.status(400).json({ error: 'Некорректная start_date' });
  if (end_date !== undefined && end_date !== null && !DATE_RE.test(end_date)) {
    return res.status(400).json({ error: 'Некорректная end_date' });
  }

  try {
    const userId = await getUserId(req.telegramUser.id);
    if (!userId) return res.status(404).json({ error: 'Юзер не найден' });

    const { rows } = await pool.query(
      `INSERT INTO cycles (user_id, start_date, end_date) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, start_date) DO UPDATE SET end_date = $3
       RETURNING *`,
      [userId, start_date, end_date || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/cycle/cycles/:id
router.delete('/cycles/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Некорректный id' });

  try {
    const userId = await getUserId(req.telegramUser.id);
    if (!userId) return res.status(404).json({ error: 'Юзер не найден' });

    const { rowCount } = await pool.query('DELETE FROM cycles WHERE id = $1 AND user_id = $2', [
      req.params.id,
      userId,
    ]);
    if (!rowCount) return res.status(404).json({ error: 'Цикл не найден' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/cycle/daily-logs — вся история настроения/симптомов (для календаря)
router.get('/daily-logs', async (req, res) => {
  try {
    const userId = await getUserId(req.telegramUser.id);
    if (!userId) return res.status(404).json({ error: 'Юзер не найден' });

    const { rows } = await pool.query(
      'SELECT * FROM daily_logs WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/cycle/daily-logs — записать/обновить настроение и симптомы на дату
router.post('/daily-logs', async (req, res) => {
  const { date, mood, symptoms, note } = req.body;

  if (!DATE_RE.test(date)) return res.status(400).json({ error: 'Некорректная date' });
  if (mood !== undefined && mood !== null && !MOODS.includes(mood)) {
    return res.status(400).json({ error: 'Некорректное mood' });
  }
  if (symptoms !== undefined && !Array.isArray(symptoms)) {
    return res.status(400).json({ error: 'symptoms должен быть массивом' });
  }

  try {
    const userId = await getUserId(req.telegramUser.id);
    if (!userId) return res.status(404).json({ error: 'Юзер не найден' });

    const { rows } = await pool.query(
      `INSERT INTO daily_logs (user_id, date, mood, symptoms, note)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, date) DO UPDATE
         SET mood = COALESCE($3, daily_logs.mood),
             symptoms = COALESCE($4, daily_logs.symptoms),
             note = COALESCE($5, daily_logs.note)
       RETURNING *`,
      [userId, date, mood ?? null, symptoms ? JSON.stringify(symptoms) : null, note ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/cycle/today — вычисленный день/фаза/прогноз
router.get('/today', async (req, res) => {
  try {
    const userId = await getUserId(req.telegramUser.id);
    if (!userId) return res.status(404).json({ error: 'Юзер не найден' });

    const [{ rows: cycles }, { rows: settingsRows }] = await Promise.all([
      pool.query('SELECT start_date, end_date FROM cycles WHERE user_id = $1', [userId]),
      pool.query('SELECT * FROM cycle_settings WHERE user_id = $1', [userId]),
    ]);

    const settings = settingsRows[0] || { avg_cycle_length: 28, avg_period_length: 5 };
    res.json(computeCycleInfo(cycles, settings));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
