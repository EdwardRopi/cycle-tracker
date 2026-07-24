const STORAGE_KEY = 'cycle-tracker-icon-style';
const STYLES = ['neon', 'gold'];
const DEFAULT_STYLE = 'neon';

export function getStoredIconStyle() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return STYLES.includes(stored) ? stored : DEFAULT_STYLE;
}

export function setIconStyle(style) {
  if (!STYLES.includes(style)) return;
  localStorage.setItem(STORAGE_KEY, style);
  document.documentElement.dataset.iconStyle = style;
}

export function initIconStyle() {
  document.documentElement.dataset.iconStyle = getStoredIconStyle();
}
