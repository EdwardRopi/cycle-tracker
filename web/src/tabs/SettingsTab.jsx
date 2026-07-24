import { useEffect, useState } from 'react';
import { api } from '../api';
import { haptic } from '../haptic';
import Spinner from '../Spinner';
import { getStoredPreference, setThemePreference } from '../theme';
import { getStoredIconStyle, setIconStyle } from '../iconStyle';

const THEME_OPTIONS = [
  { key: 'dark', label: 'Тёмная' },
  { key: 'light', label: 'Светлая' },
  { key: 'auto', label: 'Авто' },
];

const ICON_STYLE_OPTIONS = [
  { key: 'neon', label: 'Неон' },
  { key: 'gold', label: 'Золото' },
];

export default function SettingsTab({ user, setUser }) {
  const [settings, setSettings] = useState(null);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [displayName, setDisplayName] = useState(user?.display_name || user?.first_name || '');
  const [theme, setTheme] = useState(getStoredPreference());
  const [iconStyle, setIconStyleState] = useState(getStoredIconStyle());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getSettings()
      .then((s) => {
        setSettings(s);
        setCycleLength(s.avg_cycle_length);
        setPeriodLength(s.avg_period_length);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleThemeChange(key) {
    setTheme(key);
    setThemePreference(key);
    haptic('selection');
  }

  function handleIconStyleChange(key) {
    setIconStyleState(key);
    setIconStyle(key);
    haptic('selection');
  }

  async function handleSaveCycle(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const updated = await api.updateSettings({
        avg_cycle_length: Number(cycleLength),
        avg_period_length: Number(periodLength),
      });
      setSettings(updated);
      haptic('success');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveName(e) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setBusy(true);
    setError('');
    try {
      const updated = await api.updateProfile({ display_name: displayName.trim() });
      setUser(updated);
      haptic('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading || !settings) {
    return (
      <div className="tab-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="tab-screen">
      <section className="card">
        <h2>Имя</h2>
        <form onSubmit={handleSaveName}>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} />
          <button type="submit" className="primary" disabled={busy || !displayName.trim()}>
            Сохранить
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Настройки цикла</h2>
        <form onSubmit={handleSaveCycle}>
          <label>
            Средняя длина цикла (дней)
            <input
              type="number"
              min={15}
              max={60}
              value={cycleLength}
              onChange={(e) => setCycleLength(e.target.value)}
            />
          </label>
          <label>
            Средняя длина месячных (дней)
            <input
              type="number"
              min={1}
              max={14}
              value={periodLength}
              onChange={(e) => setPeriodLength(e.target.value)}
            />
          </label>
          <button type="submit" className="primary" disabled={busy}>
            Сохранить
          </button>
        </form>
        {saved && <p className="success">Сохранено</p>}
      </section>

      <section className="card">
        <h2>Оформление</h2>

        <div className="setting-row">
          <span className="setting-row-label">Тема</span>
          <div className="segmented">
            {THEME_OPTIONS.map((opt) => (
              <div
                key={opt.key}
                className={`segmented-option ${theme === opt.key ? 'active' : ''}`}
                onClick={() => handleThemeChange(opt.key)}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>

        <div className="setting-row">
          <span className="setting-row-label">Иконки навигации</span>
          <div className="segmented">
            {ICON_STYLE_OPTIONS.map((opt) => (
              <div
                key={opt.key}
                className={`segmented-option ${iconStyle === opt.key ? 'active' : ''}`}
                onClick={() => handleIconStyleChange(opt.key)}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
