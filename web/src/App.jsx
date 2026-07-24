import { useEffect, useState } from 'react';
import { api } from './api';
import BottomNav from './BottomNav';
import Spinner from './Spinner';
import TodayTab from './tabs/TodayTab';
import CalendarTab from './tabs/CalendarTab';
import PartnerTab from './tabs/PartnerTab';
import SettingsTab from './tabs/SettingsTab';
import PartnerDashboard from './partner/PartnerDashboard';
import './App.css';

const VALID_TABS = ['today', 'calendar', 'partner', 'settings'];

function initialTab() {
  const requested = new URLSearchParams(window.location.search).get('tab');
  return VALID_TABS.includes(requested) ? requested : 'today';
}

export default function App() {
  const [tab, setTab] = useState(initialTab);
  const [user, setUser] = useState(null);
  const [isPartner, setIsPartner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();

    async function load() {
      try {
        const profile = await api.initAuth();
        setUser(profile);
        const status = await api.getPartnerStatus();
        setIsPartner(!!status.asPartner);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="tab-screen">
        <Spinner label="Загрузка..." />
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

  // Партнёр не ведёт свой цикл — вместо табов сразу видит дашборд девушки
  if (isPartner) {
    return (
      <div className="app">
        <main className="app-content">
          <PartnerDashboard />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <main className="app-content">
        {tab === 'today' && <TodayTab />}
        {tab === 'calendar' && <CalendarTab />}
        {tab === 'partner' && <PartnerTab />}
        {tab === 'settings' && <SettingsTab user={user} setUser={setUser} />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
