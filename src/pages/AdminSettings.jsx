import React, { useState } from 'react';
import { onValue, ref, update } from 'firebase/database';
import { FiSave, FiSettings } from 'react-icons/fi';
import { auth, database } from '../firebase/firebaseConfig.jsx';
import { adminApiUrl } from '../Utils/adminApi';
import './admin-dashboard-troop.css';

const defaultSettings = {
  maintenanceMode: false,
  allowRegistrations: true,
  supportEmail: 'Ekotix234@gmail.com',
  supportPhone: '+2349035092518',
  payoutReviewWindowHours: 24,
  minWithdrawalAmount: 1000,
  maxWithdrawalAmount: 1000000,
  requireHostVerification: true,
  requireEmailVerificationForHosts: false,
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const AdminSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  React.useEffect(() => {
    const off = onValue(ref(database, 'platformSettings'), (snapshot) => {
      const data = snapshot.val() || {};
      setSettings((prev) => ({ ...prev, ...data }));
    });

    return () => off();
  }, []);

  const sendAudit = async (action, details) => {
    try {
      if (!auth?.currentUser) return;
      const token = await auth.currentUser.getIdToken(true);
      await fetch(adminApiUrl('/audit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, details }),
      });
    } catch (error) {
      console.warn('Failed to send audit log', error);
    }
  };

  const onTextChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const onBoolChange = (key, checked) => {
    setSettings((prev) => ({ ...prev, [key]: checked }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setFeedback({ type: '', message: '' });

      const payload = {
        maintenanceMode: Boolean(settings.maintenanceMode),
        allowRegistrations: Boolean(settings.allowRegistrations),
        supportEmail: settings.supportEmail || '',
        supportPhone: settings.supportPhone || '',
        payoutReviewWindowHours: toNumber(settings.payoutReviewWindowHours, 24),
        minWithdrawalAmount: toNumber(settings.minWithdrawalAmount, 1000),
        maxWithdrawalAmount: toNumber(settings.maxWithdrawalAmount, 1000000),
        requireHostVerification: Boolean(settings.requireHostVerification),
        requireEmailVerificationForHosts: Boolean(settings.requireEmailVerificationForHosts),
        updatedAt: Date.now(),
      };

      await update(ref(database, 'platformSettings'), payload);
      await sendAudit('settings_update', payload);
      setFeedback({ type: 'success', message: 'Settings saved successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-head admin-transactions-header">
        <div>
          <span className="admin-panel-chip">Configuration</span>
          <h2>Platform settings</h2>
        </div>
        <div className="tx-pills">
          <div className={`tx-pill ${settings.maintenanceMode ? 'red' : 'green'}`}>
            {settings.maintenanceMode ? 'Maintenance ON' : 'Maintenance OFF'}
          </div>
          <button type="button" className="admin-primary-btn" onClick={saveSettings} disabled={saving}>
            <FiSave aria-hidden="true" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {feedback.message ? (
        <p
          className={feedback.type === 'success' ? 'admin-value admin-value-emerald' : ''}
          style={feedback.type === 'error' ? { color: '#dc2626', fontWeight: 600 } : undefined}
        >
          {feedback.message}
        </p>
      ) : null}

      <div className="admin-finance-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}>
        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="admin-panel-chip">
                <FiSettings aria-hidden="true" />
                Access
              </span>
              <h2>Access controls</h2>
            </div>
          </div>

          <div className="admin-health-list">
            <label className="admin-health-item" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={Boolean(settings.maintenanceMode)}
                onChange={(event) => onBoolChange('maintenanceMode', event.target.checked)}
              />
              <div>
                <strong>Maintenance mode</strong>
                <p>Temporarily restrict platform operations.</p>
              </div>
            </label>

            <label className="admin-health-item" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={Boolean(settings.allowRegistrations)}
                onChange={(event) => onBoolChange('allowRegistrations', event.target.checked)}
              />
              <div>
                <strong>Allow new registrations</strong>
                <p>Enable signup for new accounts.</p>
              </div>
            </label>

            <label className="admin-health-item" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={Boolean(settings.requireHostVerification)}
                onChange={(event) => onBoolChange('requireHostVerification', event.target.checked)}
              />
              <div>
                <strong>Require host payout verification</strong>
                <p>Hosts must verify payout details before publishing.</p>
              </div>
            </label>

            <label className="admin-health-item" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={Boolean(settings.requireEmailVerificationForHosts)}
                onChange={(event) => onBoolChange('requireEmailVerificationForHosts', event.target.checked)}
              />
              <div>
                <strong>Require host email verification</strong>
                <p>Host tools are unlocked only after verified email.</p>
              </div>
            </label>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="admin-panel-chip">Operations</span>
              <h2>Finance and support</h2>
            </div>
          </div>

          <div className="admin-event-list">
            <label className="admin-event-item" style={{ display: 'grid', gap: 8 }}>
              <strong>Support Email</strong>
              <input
                type="email"
                value={settings.supportEmail || ''}
                onChange={(event) => onTextChange('supportEmail', event.target.value)}
              />
            </label>

            <label className="admin-event-item" style={{ display: 'grid', gap: 8 }}>
              <strong>Support Phone</strong>
              <input
                type="text"
                value={settings.supportPhone || ''}
                onChange={(event) => onTextChange('supportPhone', event.target.value)}
              />
            </label>

            <label className="admin-event-item" style={{ display: 'grid', gap: 8 }}>
              <strong>Payout Review Window (Hours)</strong>
              <input
                type="number"
                min="1"
                value={settings.payoutReviewWindowHours ?? 24}
                onChange={(event) => onTextChange('payoutReviewWindowHours', event.target.value)}
              />
            </label>

            <label className="admin-event-item" style={{ display: 'grid', gap: 8 }}>
              <strong>Minimum Withdrawal Amount</strong>
              <input
                type="number"
                min="0"
                value={settings.minWithdrawalAmount ?? 1000}
                onChange={(event) => onTextChange('minWithdrawalAmount', event.target.value)}
              />
            </label>

            <label className="admin-event-item" style={{ display: 'grid', gap: 8 }}>
              <strong>Maximum Withdrawal Amount</strong>
              <input
                type="number"
                min="0"
                value={settings.maxWithdrawalAmount ?? 1000000}
                onChange={(event) => onTextChange('maxWithdrawalAmount', event.target.value)}
              />
            </label>
          </div>
        </article>
      </div>
    </div>
  );
};

export default AdminSettings;
