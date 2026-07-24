const TelegramBot = require('node-telegram-bot-api');
const pool = require('../db/pool');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

async function upsertUser(fromUser) {
  const { rows } = await pool.query(
    `INSERT INTO users (telegram_id, first_name, username, display_name)
     VALUES ($1, $2, $3, $2)
     ON CONFLICT (telegram_id) DO UPDATE SET first_name = $2, username = $3
     RETURNING *`,
    [fromUser.id, fromUser.first_name, fromUser.username]
  );
  const userId = rows[0].id;
  await pool.query(
    `INSERT INTO cycle_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
  return rows[0];
}

// Партнёрская пригласительная ссылка — Telegram шлёт "/start partner_<token>", если
// перешли по ссылке вида t.me/<bot>?start=partner_<token>. Привязываем аккаунты.
async function handlePartnerPayload(payload, fromUser) {
  if (!payload || !payload.startsWith('partner_')) return null;

  const token = payload.slice('partner_'.length);
  const { rows: linkRows } = await pool.query(
    `SELECT id, owner_user_id FROM partner_links WHERE invite_token = $1 AND status = 'pending'`,
    [token]
  );
  const link = linkRows[0];
  if (!link) return null;

  const partnerUser = await upsertUser(fromUser);
  if (partnerUser.id === link.owner_user_id) return null; // нельзя привязать себя к себе

  await pool.query(
    `UPDATE partner_links SET partner_user_id = $1, status = 'accepted', linked_at = NOW() WHERE id = $2`,
    [partnerUser.id, link.id]
  );

  const { rows: ownerRows } = await pool.query('SELECT telegram_id, display_name, first_name FROM users WHERE id = $1', [
    link.owner_user_id,
  ]);

  return {
    ownerTelegramId: ownerRows[0]?.telegram_id,
    partnerName: partnerUser.display_name || partnerUser.first_name,
  };
}

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;

  try {
    const linked = await handlePartnerPayload(match[1], msg.from);
    if (linked) {
      if (linked.ownerTelegramId) {
        await bot.sendMessage(
          linked.ownerTelegramId,
          `${linked.partnerName} подключился(-ась) и теперь видит твой цикл 💜`
        );
      }
      await bot.sendMessage(chatId, 'Готово! Ты подключён(-а) как партнёр. Открой мини-апп:', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Открыть', web_app: { url: process.env.WEBAPP_URL || 'https://example.com' } }]],
        },
      });
      return;
    }
  } catch (err) {
    console.error('Ошибка обработки партнёрской ссылки:', err);
  }

  bot.sendMessage(
    chatId,
    'Привет! Я помогу отслеживать цикл и делиться им с партнёром. Открой мини-апп, чтобы начать:',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Открыть трекер', web_app: { url: process.env.WEBAPP_URL || 'https://example.com' } }],
        ],
      },
    }
  );
});

module.exports = bot;
