const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const pool = require('../db/pool');
const { computeCycleInfo } = require('../cycle');

async function getUserId(telegramId) {
  const { rows } = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [telegramId]);
  return rows[0]?.id;
}

function botUsername() {
  return process.env.BOT_USERNAME || '';
}

// POST /api/partner/invite — создать (или переиспользовать) пригласительную ссылку.
// Одна активная (accepted) связь на владельца — если уже привязан партнёр, нужно
// сначала отвязать его.
router.post('/invite', async (req, res) => {
  try {
    const userId = await getUserId(req.telegramUser.id);
    if (!userId) return res.status(404).json({ error: 'Юзер не найден' });

    const { rows: existingAccepted } = await pool.query(
      `SELECT id FROM partner_links WHERE owner_user_id = $1 AND status = 'accepted'`,
      [userId]
    );
    if (existingAccepted[0]) {
      return res.status(409).json({ error: 'У тебя уже есть привязанный партнёр — сначала отвяжи его' });
    }

    const { rows: existingPending } = await pool.query(
      `SELECT invite_token FROM partner_links WHERE owner_user_id = $1 AND status = 'pending'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    const token = existingPending[0]?.invite_token || crypto.randomBytes(16).toString('hex');

    if (!existingPending[0]) {
      await pool.query(
        `INSERT INTO partner_links (owner_user_id, invite_token) VALUES ($1, $2)`,
        [userId, token]
      );
    }

    res.status(201).json({
      token,
      invite_url: `https://t.me/${botUsername()}?start=partner_${token}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/partner/status — моя связь как владелец (кто смотрит мой цикл)
// и как партнёр (чей цикл смотрю я)
router.get('/status', async (req, res) => {
  try {
    const userId = await getUserId(req.telegramUser.id);
    if (!userId) return res.status(404).json({ error: 'Юзер не найден' });

    const { rows: asOwnerRows } = await pool.query(
      `SELECT pl.status, pl.invite_token, u.display_name, u.first_name
       FROM partner_links pl LEFT JOIN users u ON u.id = pl.partner_user_id
       WHERE pl.owner_user_id = $1 ORDER BY pl.created_at DESC LIMIT 1`,
      [userId]
    );

    const { rows: asPartnerRows } = await pool.query(
      `SELECT pl.id AS link_id, u.display_name, u.first_name
       FROM partner_links pl JOIN users u ON u.id = pl.owner_user_id
       WHERE pl.partner_user_id = $1 AND pl.status = 'accepted'`,
      [userId]
    );

    res.json({
      asOwner: asOwnerRows[0]
        ? {
            status: asOwnerRows[0].status,
            token: asOwnerRows[0].invite_token,
            inviteUrl: `https://t.me/${botUsername()}?start=partner_${asOwnerRows[0].invite_token}`,
            partnerName: asOwnerRows[0].display_name || asOwnerRows[0].first_name || null,
          }
        : { status: 'none' },
      asPartner: asPartnerRows[0]
        ? { linkId: asPartnerRows[0].link_id, ownerName: asPartnerRows[0].display_name || asPartnerRows[0].first_name }
        : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/partner/unlink — отвязать партнёра (доступно владелице)
router.delete('/unlink', async (req, res) => {
  try {
    const userId = await getUserId(req.telegramUser.id);
    if (!userId) return res.status(404).json({ error: 'Юзер не найден' });

    await pool.query(`DELETE FROM partner_links WHERE owner_user_id = $1`, [userId]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/partner/view — партнёр читает цикл и настроение привязанной девушки
router.get('/view', async (req, res) => {
  try {
    const userId = await getUserId(req.telegramUser.id);
    if (!userId) return res.status(404).json({ error: 'Юзер не найден' });

    const { rows: linkRows } = await pool.query(
      `SELECT owner_user_id FROM partner_links WHERE partner_user_id = $1 AND status = 'accepted'`,
      [userId]
    );
    if (!linkRows[0]) return res.status(404).json({ error: 'Нет привязанной девушки' });

    const ownerId = linkRows[0].owner_user_id;

    const [{ rows: owner }, { rows: cycles }, { rows: settingsRows }, { rows: logs }] = await Promise.all([
      pool.query('SELECT display_name, first_name FROM users WHERE id = $1', [ownerId]),
      pool.query('SELECT start_date, end_date FROM cycles WHERE user_id = $1', [ownerId]),
      pool.query('SELECT * FROM cycle_settings WHERE user_id = $1', [ownerId]),
      pool.query('SELECT date, mood, symptoms, note FROM daily_logs WHERE user_id = $1 ORDER BY date DESC LIMIT 30', [ownerId]),
    ]);

    const settings = settingsRows[0] || { avg_cycle_length: 28, avg_period_length: 5 };

    res.json({
      ownerName: owner[0]?.display_name || owner[0]?.first_name || 'Партнёр',
      cycle: computeCycleInfo(cycles, settings),
      recentLogs: logs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
