import { useEffect, useState } from 'react';
import { api } from '../api';
import { haptic } from '../haptic';
import Spinner from '../Spinner';
import { MOODS, SYMPTOMS, PHASES, moodByKey, todayISO, formatShortDate, formatShortRange } from '../constants';

export default function TodayTab() {
  const [cycleInfo, setCycleInfo] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [mood, setMood] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(true);
  const [periodStart, setPeriodStart] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [info, logs] = await Promise.all([api.getToday(), api.getDailyLogs()]);
      setCycleInfo(info);
      const existing = logs.find((l) => l.date === todayISO());
      if (existing) {
        setTodayLog(existing);
        setMood(existing.mood || null);
        setSymptoms(existing.symptoms || []);
        setNote(existing.note || '');
        setEditing(false);
      } else {
        setEditing(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStartPeriod(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.addCycle({ start_date: periodStart });
      haptic('success');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function toggleSymptom(key) {
    setSymptoms((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  }

  async function handleSaveLog(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const entry = await api.saveDailyLog({ date: todayISO(), mood, symptoms, note: note.trim() || null });
      setTodayLog(entry);
      haptic('success');
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="tab-screen">
        <Spinner />
      </div>
    );
  }

  if (!cycleInfo?.hasData) {
    return (
      <div className="tab-screen">
        <section className="card">
          <h2>Когда начались последние месячные?</h2>
          <p className="hint">Это нужно, чтобы считать день цикла, фазу и прогноз.</p>
          <form onSubmit={handleStartPeriod}>
            <label>
              Дата начала
              <input
                type="date"
                value={periodStart}
                max={todayISO()}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </label>
            <button type="submit" className="primary" disabled={busy}>
              Сохранить
            </button>
          </form>
        </section>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  const phase = PHASES[cycleInfo.phase];
  const moodInfo = moodByKey(mood);

  return (
    <div className="tab-screen">
      <section className="card phase-card">
        <span className="phase-icon">{phase.icon}</span>
        <span className="phase-day">День {cycleInfo.cycleDay}</span>
        <span className="phase-label">{phase.label}</span>
        <div className="phase-stats">
          <div className="phase-stat">
            <span className="phase-stat-label">Месячные</span>
            <span className="phase-stat-value">{formatShortDate(cycleInfo.predictedNextPeriod)}</span>
          </div>
          <div className="phase-stat">
            <span className="phase-stat-label">Овуляция</span>
            <span className="phase-stat-value">{formatShortDate(cycleInfo.predictedOvulation)}</span>
          </div>
          <div className="phase-stat">
            <span className="phase-stat-label">Фертильное окно</span>
            <span className="phase-stat-value">
              {formatShortRange(cycleInfo.fertileWindow.start, cycleInfo.fertileWindow.end)}
            </span>
          </div>
          <div className="phase-stat">
            <span className="phase-stat-label">Длина цикла</span>
            <span className="phase-stat-value">{cycleInfo.avgCycleLength} дней</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header-row">
          <h2>Как ты сегодня?</h2>
          {!editing && (
            <button type="button" className="text-link" onClick={() => setEditing(true)}>
              Изменить
            </button>
          )}
        </div>

        {!editing ? (
          <div className="today-summary">
            {moodInfo && (
              <div className="today-summary-mood">
                <span className="mood-icon">{moodInfo.icon}</span>
                {moodInfo.label}
              </div>
            )}
            {symptoms.length > 0 && (
              <div className="today-summary-symptoms">
                {symptoms.map((s) => SYMPTOMS.find((sy) => sy.key === s)?.label || s).join(', ')}
              </div>
            )}
            {note && <p className="hint">{note}</p>}
            {!moodInfo && symptoms.length === 0 && !note && <p className="hint">Запись на сегодня сохранена</p>}
          </div>
        ) : (
          <form onSubmit={handleSaveLog}>
            <div className="mood-grid">
              {MOODS.map((m) => (
                <div
                  key={m.key}
                  className={`mood-option ${mood === m.key ? 'active' : ''}`}
                  onClick={() => setMood(m.key)}
                >
                  <span className="mood-icon">{m.icon}</span>
                  {m.label}
                </div>
              ))}
            </div>

            <div className="symptom-grid">
              {SYMPTOMS.map((s) => (
                <div
                  key={s.key}
                  className={`symptom-chip ${symptoms.includes(s.key) ? 'active' : ''}`}
                  onClick={() => toggleSymptom(s.key)}
                >
                  <span>{s.icon}</span>
                  {s.label}
                </div>
              ))}
            </div>

            <textarea
              placeholder="Заметка на сегодня (необязательно)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />

            <button type="submit" className="primary" disabled={busy}>
              {todayLog ? 'Обновить' : 'Сохранить'}
            </button>
          </form>
        )}
        {saved && <p className="success">Сохранено</p>}
      </section>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
