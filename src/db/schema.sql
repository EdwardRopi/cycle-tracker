-- Юзеры, которые зашли в мини-апп (и девушки, и партнёры — одна таблица)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  first_name TEXT,
  username TEXT,
  display_name TEXT,  -- имя, которое видит партнёр — можно поменять, иначе = first_name
  last_seen_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Настройки цикла: средняя длина цикла и средняя длина самих месячных
CREATE TABLE IF NOT EXISTS cycle_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avg_cycle_length INTEGER NOT NULL DEFAULT 28,
  avg_period_length INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Один зафиксированный период = одна строка. Прогноз считается от последней start_date.
CREATE TABLE IF NOT EXISTS cycles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, start_date)
);

-- Настроение и симптомы на конкретный день
CREATE TABLE IF NOT EXISTS daily_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood TEXT,
  symptoms JSONB NOT NULL DEFAULT '[]',
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- Связь "девушка — партнёр". Заполняется по пригласительной ссылке (deep-link /start).
-- owner_user_id — та, чей цикл отслеживается; partner_user_id — кто смотрит.
CREATE TABLE IF NOT EXISTS partner_links (
  id SERIAL PRIMARY KEY,
  owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  invite_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'accepted'
  created_at TIMESTAMP DEFAULT NOW(),
  linked_at TIMESTAMP
);
