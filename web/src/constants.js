export const MOODS = [
  { key: 'great', label: 'Отлично', icon: '😄' },
  { key: 'good', label: 'Хорошо', icon: '🙂' },
  { key: 'okay', label: 'Нормально', icon: '😐' },
  { key: 'low', label: 'Уставшая', icon: '😴' },
  { key: 'irritable', label: 'Раздражена', icon: '😠' },
  { key: 'sad', label: 'Грустно', icon: '😢' },
];

export const SYMPTOMS = [
  { key: 'cramps', label: 'Спазмы', icon: '🌀' },
  { key: 'headache', label: 'Голова', icon: '🤕' },
  { key: 'bloating', label: 'Вздутие', icon: '🎈' },
  { key: 'backache', label: 'Поясница', icon: '🦴' },
  { key: 'nausea', label: 'Тошнота', icon: '🤢' },
  { key: 'acne', label: 'Высыпания', icon: '✨' },
  { key: 'cravings', label: 'Тяга к еде', icon: '🍫' },
  { key: 'breast_tenderness', label: 'Грудь', icon: '💗' },
];

export const PHASES = {
  menstrual: { label: 'Менструация', icon: '🩸' },
  follicular: { label: 'Фолликулярная фаза', icon: '🌱' },
  ovulation: { label: 'Овуляция', icon: '🌸' },
  luteal: { label: 'Лютеиновая фаза', icon: '🌙' },
};

export function moodByKey(key) {
  return MOODS.find((m) => m.key === key);
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

// Парсим строки вручную, а не через new Date(iso) — избегаем сдвига на часовой пояс
export function formatShortDate(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

export function formatShortRange(startIso, endIso) {
  const [, ms, ds] = startIso.split('-').map(Number);
  const [, me, de] = endIso.split('-').map(Number);
  if (ms === me) {
    return `${ds}–${de} ${MONTHS_SHORT[ms - 1]}`;
  }
  return `${formatShortDate(startIso)} – ${formatShortDate(endIso)}`;
}
