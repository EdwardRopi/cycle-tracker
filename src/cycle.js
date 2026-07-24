const DAY_MS = 86400000;
const LUTEAL_PHASE_LENGTH = 14; // стабильна почти всегда, в отличие от фолликулярной фазы

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function diffDays(a, b) {
  return Math.floor((a.getTime() - b.getTime()) / DAY_MS);
}

function toDateOnly(value) {
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDate(date) {
  // Не toISOString() — оно конвертирует в UTC и в часовых поясах восточнее UTC
  // сдвигает локальную полночь на день назад (напр. Europe/Moscow, +3).
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Средняя длина цикла по последним фактическим циклам (до 6 интервалов),
// иначе — ручная настройка юзера
function averageCycleLength(cycles, fallback) {
  if (cycles.length < 2) return fallback;

  const starts = cycles.map((c) => toDateOnly(c.start_date)).sort((a, b) => a - b);
  const recent = starts.slice(-7); // до 6 интервалов между 7 датами
  const intervals = [];
  for (let i = 1; i < recent.length; i++) {
    intervals.push(diffDays(recent[i], recent[i - 1]));
  }
  if (!intervals.length) return fallback;

  const avg = intervals.reduce((sum, n) => sum + n, 0) / intervals.length;
  return Math.round(avg);
}

function phaseForDay(cycleDay, avgPeriodLength, ovulationDay) {
  if (cycleDay <= avgPeriodLength) return 'menstrual';
  if (cycleDay < ovulationDay - 1) return 'follicular';
  if (cycleDay <= ovulationDay + 1) return 'ovulation';
  return 'luteal';
}

/**
 * cycles — все зафиксированные циклы юзера (start_date/end_date), любой порядок
 * settings — { avg_cycle_length, avg_period_length }
 * today — Date, для тестируемости
 */
function computeCycleInfo(cycles, settings, today = new Date()) {
  if (!cycles.length) {
    return { hasData: false };
  }

  const sorted = [...cycles].sort((a, b) => toDateOnly(a.start_date) - toDateOnly(b.start_date));
  const lastStart = toDateOnly(sorted[sorted.length - 1].start_date);
  const todayOnly = toDateOnly(today);

  const avgCycleLength = averageCycleLength(sorted, settings.avg_cycle_length);
  const avgPeriodLength = settings.avg_period_length;
  const ovulationDay = Math.max(1, avgCycleLength - LUTEAL_PHASE_LENGTH + 1);

  const daysSinceStart = Math.max(0, diffDays(todayOnly, lastStart));
  const cyclesElapsed = Math.floor(daysSinceStart / avgCycleLength);
  const cycleDay = (daysSinceStart % avgCycleLength) + 1;

  const currentCycleStart = addDays(lastStart, cyclesElapsed * avgCycleLength);
  const nextPeriodStart = addDays(currentCycleStart, avgCycleLength);
  const ovulationDate = addDays(currentCycleStart, ovulationDay - 1);
  const fertileStart = addDays(ovulationDate, -5);
  const fertileEnd = addDays(ovulationDate, 1);

  return {
    hasData: true,
    cycleDay,
    avgCycleLength,
    avgPeriodLength,
    phase: phaseForDay(cycleDay, avgPeriodLength, ovulationDay),
    predictedNextPeriod: formatDate(nextPeriodStart),
    predictedOvulation: formatDate(ovulationDate),
    fertileWindow: { start: formatDate(fertileStart), end: formatDate(fertileEnd) },
  };
}

module.exports = { computeCycleInfo, averageCycleLength };
