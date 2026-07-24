import { useEffect, useState } from 'react';
import { api } from '../api';
import Spinner from '../Spinner';
import { SYMPTOMS, PHASES, moodByKey, formatShortDate } from '../constants';

export default function PartnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getPartnerView()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="tab-screen">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="tab-screen">
        <p className="error">{error}</p>
      </div>
    );
  }

  const { cycle } = data;
  const phase = cycle.hasData ? PHASES[cycle.phase] : null;

  return (
    <div className="tab-screen">
      <h1>Цикл: {data.ownerName}</h1>

      {!cycle.hasData ? (
        <section className="card">
          <p className="hint">{data.ownerName} ещё не отметила начало цикла.</p>
        </section>
      ) : (
        <section className="card phase-card">
          <span className="phase-icon">{phase.icon}</span>
          <span className="phase-day">День {cycle.cycleDay}</span>
          <span className="phase-label">{phase.label}</span>
          <div className="phase-stats">
            <div className="phase-stat">
              <span className="phase-stat-label">Месячные</span>
              <span className="phase-stat-value">{formatShortDate(cycle.predictedNextPeriod)}</span>
            </div>
            <div className="phase-stat">
              <span className="phase-stat-label">Овуляция</span>
              <span className="phase-stat-value">{formatShortDate(cycle.predictedOvulation)}</span>
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <h2>Последние записи</h2>
        {data.recentLogs.length === 0 && <p className="hint">Пока нет записей о настроении</p>}
        {data.recentLogs.map((log) => {
          const moodInfo = moodByKey(log.mood);
          return (
            <div key={log.date} className="log-row">
              <span className="log-row-date">{formatShortDate(log.date)}</span>
              {moodInfo && (
                <span className="log-row-mood">
                  {moodInfo.icon} {moodInfo.label}
                </span>
              )}
              {log.symptoms?.length > 0 && (
                <span className="log-row-symptoms">
                  {log.symptoms.map((s) => SYMPTOMS.find((sy) => sy.key === s)?.label || s).join(', ')}
                </span>
              )}
              {log.note && <span className="hint">{log.note}</span>}
            </div>
          );
        })}
      </section>
    </div>
  );
}
