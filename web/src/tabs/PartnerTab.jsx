import { useEffect, useState } from 'react';
import { api } from '../api';
import { haptic } from '../haptic';
import Spinner from '../Spinner';

export default function PartnerTab() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const s = await api.getPartnerStatus();
      setStatus(s.asOwner);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleInvite() {
    setBusy(true);
    setError('');
    try {
      await api.invitePartner();
      haptic('success');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleShare(url) {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(
      'Присоединяйся, чтобы видеть мой цикл и настроение 💜'
    )}`;
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  }

  async function handleUnlink() {
    setBusy(true);
    setError('');
    try {
      await api.unlinkPartner();
      haptic('success');
      setConfirmUnlink(false);
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

  return (
    <div className="tab-screen">
      <section className="card partner-invite">
        <span className="partner-icon">💜</span>

        {status?.status === 'accepted' && (
          <>
            <h2>{status.partnerName} видит твой цикл</h2>
            <p className="hint">Текущий день, фаза, настроение и симптомы обновляются автоматически.</p>
            {confirmUnlink ? (
              <div className="confirm">
                <p className="hint">Точно отвязать партнёра?</p>
                <div className="confirm-buttons">
                  <button onClick={() => setConfirmUnlink(false)} disabled={busy}>
                    Отмена
                  </button>
                  <button className="danger" onClick={handleUnlink} disabled={busy}>
                    Отвязать
                  </button>
                </div>
              </div>
            ) : (
              <button className="secondary" onClick={() => setConfirmUnlink(true)}>
                Отвязать партнёра
              </button>
            )}
          </>
        )}

        {status?.status === 'pending' && (
          <>
            <h2>Ссылка создана</h2>
            <p className="hint">Отправь её партнёру — как только он перейдёт по ней, вы будете связаны.</p>
            <div className="partner-link-box">{status.inviteUrl}</div>
            <button className="primary" onClick={() => handleShare(status.inviteUrl)}>
              Поделиться ссылкой
            </button>
            <button className="secondary" onClick={() => setConfirmUnlink(true)} disabled={busy}>
              Отменить приглашение
            </button>
            {confirmUnlink && (
              <div className="confirm">
                <p className="hint">Отменить приглашение?</p>
                <div className="confirm-buttons">
                  <button onClick={() => setConfirmUnlink(false)} disabled={busy}>
                    Нет
                  </button>
                  <button className="danger" onClick={handleUnlink} disabled={busy}>
                    Да, отменить
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {(!status || status.status === 'none') && (
          <>
            <h2>Поделись циклом с партнёром</h2>
            <p className="hint">
              Он будет видеть день цикла, фазу, настроение и симптомы — без ручной настройки, всё сразу.
            </p>
            <button className="primary" onClick={handleInvite} disabled={busy}>
              Пригласить партнёра
            </button>
          </>
        )}
      </section>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
