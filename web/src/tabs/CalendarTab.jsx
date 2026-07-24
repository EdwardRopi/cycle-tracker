import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { haptic } from '../haptic';
import Spinner from '../Spinner';
import { MOODS, SYMPTOMS, todayISO } from '../constants';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function toISO(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function buildMonthGrid(year, month) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  return cells;
}

function isWithinCycle(dateISO, cycle) {
  const end = cycle.end_date || cycle.start_date;
  return dateISO >= cycle.start_date && dateISO <= end;
}

export default function CalendarTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [cycles, setCycles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mood, setMood] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [note, setNote] = useState('');
  const [showAddCycle, setShowAddCycle] = useState(false);
  const [newStart, setNewStart] = useState(todayISO());
  const [newEnd, setNewEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [cyclesData, logsData] = await Promise.all([api.getCycles(), api.getDailyLogs()]);
      setCycles(cyclesData);
      setLogs(logsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const logsByDate = useMemo(() => {
    const map = new Map();
    logs.forEach((l) => map.set(l.date, l));
    return map;
  }, [logs]);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  function changeMonth(delta) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  function selectDay(dateISO) {
    haptic('selection');
    setSelected(dateISO);
    const existing = logsByDate.get(dateISO);
    setMood(existing?.mood || null);
    setSymptoms(existing?.symptoms || []);
    setNote(existing?.note || '');
  }

  function toggleSymptom(key) {
    setSymptoms((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  }

  async function handleSaveLog(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.saveDailyLog({ date: selected, mood, symptoms, note: note.trim() || null });
      haptic('success');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddCycle(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.addCycle({ start_date: newStart, end_date: newEnd || null });
      haptic('success');
      setShowAddCycle(false);
      setNewEnd('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCycle(id) {
    setBusy(true);
    try {
      await api.deleteCycle(id);
      haptic('success');
      await load();
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

  const monthLabel = new Date(year, month, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  return (
    <div className="tab-screen">
      <div className="calendar-header">
        <button className="icon-button" style={{ color: 'var(--text)' }} onClick={() => changeMonth(-1)}>
          ‹
        </button>
        <strong style={{ textTransform: 'capitalize' }}>{monthLabel}</strong>
        <button className="icon-button" style={{ color: 'var(--text)' }} onClick={() => changeMonth(1)}>
          ›
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="calendar-weekday">
            {wd}
          </div>
        ))}
        {grid.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="calendar-day empty" />;
          const dateISO = toISO(year, month, day);
          const isPeriod = cycles.some((c) => isWithinCycle(dateISO, c));
          const isLogged = logsByDate.has(dateISO);
          const classes = ['calendar-day'];
          if (dateISO === todayISO()) classes.push('today');
          if (dateISO === selected) classes.push('selected');
          if (isPeriod) classes.push('period');
          if (isLogged) classes.push('logged');
          return (
            <div key={dateISO} className={classes.join(' ')} onClick={() => selectDay(dateISO)}>
              {day}
            </div>
          );
        })}
      </div>

      <div className="calendar-legend">
        <span className="calendar-legend-item">
          <span className="legend-dot period" /> Месячные
        </span>
        <span className="calendar-legend-item">
          <span className="legend-dot logged" /> Есть запись
        </span>
      </div>

      {selected && (
        <section className="card">
          <h2>{selected}</h2>
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
            <textarea placeholder="Заметка" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            <button type="submit" className="primary" disabled={busy}>
              Сохранить
            </button>
          </form>
        </section>
      )}

      <section className="card">
        <h2>История циклов</h2>
        {cycles.length === 0 && <p className="hint">Пока ничего не отмечено</p>}
        <ul className="cycle-list">
          {cycles.map((c) => (
            <li key={c.id} className="cycle-row">
              <span>
                {c.start_date}
                {c.end_date ? ` – ${c.end_date}` : ''}
              </span>
              <button className="icon-button" onClick={() => handleDeleteCycle(c.id)} disabled={busy}>
                Удалить
              </button>
            </li>
          ))}
        </ul>

        {showAddCycle ? (
          <form onSubmit={handleAddCycle}>
            <label>
              Начало
              <input type="date" value={newStart} max={todayISO()} onChange={(e) => setNewStart(e.target.value)} />
            </label>
            <label>
              Конец (необязательно)
              <input type="date" value={newEnd} max={todayISO()} onChange={(e) => setNewEnd(e.target.value)} />
            </label>
            <button type="submit" className="primary" disabled={busy}>
              Добавить
            </button>
          </form>
        ) : (
          <button className="secondary" onClick={() => setShowAddCycle(true)}>
            Добавить период
          </button>
        )}
      </section>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
