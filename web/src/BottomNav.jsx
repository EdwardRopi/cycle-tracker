import { haptic } from './haptic';

const TABS = [
  { key: 'today', label: 'Сегодня', icon: '📅' },
  { key: 'calendar', label: 'Календарь', icon: '🗓️' },
  { key: 'partner', label: 'Партнёр', icon: '💜' },
  { key: 'settings', label: 'Настройки', icon: '⚙️' },
];

export default function BottomNav({ active, onChange }) {
  function handleClick(key) {
    if (key !== active) haptic('selection');
    onChange(key);
  }

  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`bottom-nav-item ${active === tab.key ? 'active' : ''}`}
          onClick={() => handleClick(tab.key)}
        >
          <span className="bottom-nav-icon">{tab.icon}</span>
          <span className="bottom-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
