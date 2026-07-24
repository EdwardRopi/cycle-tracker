# Cycle Tracker

Telegram Mini App — трекер менструального цикла с партнёрским доступом: партнёр
по персональной пригласительной ссылке подключается и видит день/фазу цикла,
прогноз и настроение/симптомы.

## Стек

Node/Express + Postgres + node-telegram-bot-api (backend), Vite + React (frontend) —
тот же паттерн, что и в sober-tracker.

## Настройка

1. **Бот**: создай нового бота через [@BotFather](https://t.me/BotFather) →
   `/newbot` → получишь токен и username бота.
2. **База данных**: нужен Postgres (локальный для разработки или облачный,
   например Render). Отдельная база — не переиспользуй базу sober-tracker.
3. Скопируй `.env.example` → `.env` и заполни:
   - `BOT_TOKEN` — токен от BotFather
   - `BOT_USERNAME` — username бота без `@` (нужен для генерации пригласительных ссылок)
   - `DATABASE_URL` — строка подключения к Postgres
   - `WEBAPP_URL` — https-адрес задеплоенного фронтенда (для локальной разработки не обязателен)
4. Установи зависимости и накати схему:
   ```
   npm install
   npm run migrate
   ```
5. Запусти backend:
   ```
   npm run dev
   ```
6. В отдельном терминале — frontend:
   ```
   cd web
   npm install
   npm run dev
   ```
   `web/.env` уже настроен на `http://localhost:3000` (адрес backend).

## Как работает партнёрская привязка

Девушка на вкладке «Партнёр» жмёт «Пригласить партнёра» → бэкенд создаёт
персональную ссылку `t.me/<bot>?start=partner_<token>` → она отправляет её сама
через «Поделиться» в Telegram → партнёр переходит по ссылке, бот обрабатывает
`/start partner_<token>` и привязывает аккаунты. Бот не может написать
партнёру первым по одному username — это ограничение Telegram Bot API.

## Проверка на реальном устройстве

Открыть мини-апп внутри Telegram локально не получится (нужен настоящий https
`WEBAPP_URL` и initData от Telegram). Для полной проверки — задеплой backend
(Render и т.п.) и frontend (Vercel/Netlify/Render static), пропиши боевой
`WEBAPP_URL`, и открывай через кнопку в боте.
