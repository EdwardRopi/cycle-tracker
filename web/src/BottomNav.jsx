import { haptic } from './haptic';
import { IconToday, IconCalendar, IconHeart, IconSettings } from './icons';

const TABS = [
  { key: 'today', label: 'Сегодня', Icon: IconToday },
  { key: 'calendar', label: 'Календарь', Icon: IconCalendar },
  { key: 'partner', label: 'Партнёр', Icon: IconHeart },
  { key: 'settings', label: 'Настройки', Icon: IconSettings },
];

export default function BottomNav({ active, onChange }) {
  function handleClick(key) {
    if (key !== active) haptic('selection');
    onChange(key);
  }

  return (
    <nav className="bottom-nav">
      {TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          className={`bottom-nav-item ${active === key ? 'active' : ''}`}
          onClick={() => handleClick(key)}
        >
          <span className="bottom-nav-icon">
            <Icon />
          </span>
          <span className="bottom-nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
