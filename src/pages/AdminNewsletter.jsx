import React, { useEffect, useRef, useState } from 'react';
import { FiMail, FiSend } from 'react-icons/fi';
import { auth } from '../firebase/firebaseConfig.jsx';
import { adminApiUrl } from '../Utils/adminApi';
import './admin-dashboard-troop.css';

const emptyForm = {
  subject: '',
  heading: '',
  bodyText: '',
  heroImageUrl: '',
  ctaText: '',
  ctaUrl: '',
};

const statusLabel = (status) => {
  if (status === 'sent') return 'Sent';
  if (status === 'sending') return 'Sending';
  if (status === 'completed_with_errors') return 'Sent with errors';
  if (status === 'failed') return 'Failed';
  return status || 'Unknown';
};

const statusClass = (status) => {
  if (status === 'sent') return 'admin-status-completed';
  if (status === 'failed') return 'admin-status-rejected';
  if (status === 'completed_with_errors') return 'admin-status-pending';
  return 'admin-status-pending';
};

const AdminNewsletter = () => {
  const [form, setForm] = useState(emptyForm);
  const [testEmail, setTestEmail] = useState('');
  const [recipientCount, setRecipientCount] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [sendingTest, setSendingTest] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const pollRef = useRef(null);

  const authedFetch = async (path, options = {}) => {
    if (!auth?.currentUser) {
      throw new Error('You must be signed in as an admin.');
    }
    const token = await auth.currentUser.getIdToken(true);
    const response = await fetch(adminApiUrl(path), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.error || 'Request failed');
    }
    return result;
  };

  const loadRecipientCount = async () => {
    try {
      const result = await authedFetch('/newsletter/recipients');
      setRecipientCount(result.count ?? 0);
    } catch {
      setRecipientCount(null);
    }
  };

  const loadCampaigns = async () => {
    try {
      const result = await authedFetch('/newsletter/campaigns');
      setCampaigns(result.campaigns || []);
    } catch {
      // Non-fatal — history is secondary to composing/sending.
    }
  };

  useEffect(() => {
    loadRecipientCount();
    loadCampaigns();
    if (auth?.currentUser?.email) {
      setTestEmail(auth.currentUser.email);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isValid = form.subject.trim() && form.bodyText.trim() && (Boolean(form.ctaText) === Boolean(form.ctaUrl));

  const sendTest = async () => {
    try {
      setSendingTest(true);
      setFeedback({ type: '', message: '' });
      if (!testEmail.trim()) {
        throw new Error('Enter at least one test email address.');
      }
      await authedFetch('/newsletter/send', {
        method: 'POST',
        body: JSON.stringify({ ...form, testEmail }),
      });
      setFeedback({ type: 'success', message: `Test email sent to ${testEmail}.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to send test email.' });
    } finally {
      setSendingTest(false);
    }
  };

  const pollCampaign = (campaignId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const campaign = await authedFetch(`/newsletter/campaigns/${campaignId}`);
        setActiveCampaign(campaign);
        if (campaign.status !== 'sending') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          loadCampaigns();
        }
      } catch {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 2000);
  };

  const confirmAndSend = async () => {
    try {
      setConfirmSend(false);
      setFeedback({ type: '', message: '' });
      const result = await authedFetch('/newsletter/send', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setActiveCampaign({ status: 'sending', sentCount: 0, failedCount: 0, recipientCount: result.recipientCount });
      setFeedback({ type: 'success', message: `Sending to ${result.recipientCount} subscriber(s)...` });
      setForm(emptyForm);
      pollCampaign(result.campaignId);
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to start newsletter send.' });
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-head admin-transactions-header">
        <div>
          <span className="admin-panel-chip">
            <FiMail aria-hidden="true" /> Newsletter
          </span>
          <h2>Email every ticket buyer</h2>
        </div>
        <div className="tx-pills">
          <div className="tx-pill green">
            {recipientCount === null ? 'Loading subscribers...' : `${recipientCount} subscriber(s)`}
          </div>
        </div>
      </div>

      {feedback.message ? (
        <p className={feedback.type === 'success' ? 'admin-value admin-value-emerald' : feedback.type === 'error' ? 'admin-error-text' : ''}>
          {feedback.message}
        </p>
      ) : null}

      {activeCampaign ? (
        <div className="admin-card" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <strong>Current send: {statusLabel(activeCampaign.status)}</strong>
          <p style={{ margin: '.5rem 0 0' }}>
            {activeCampaign.sentCount || 0} sent
            {activeCampaign.failedCount ? `, ${activeCampaign.failedCount} failed` : ''}
            {' '}of {activeCampaign.recipientCount || 0}
          </p>
        </div>
      ) : null}

      <div className="admin-finance-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '1.5rem' }}>
        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="admin-panel-chip">Compose</span>
              <h2>New newsletter</h2>
            </div>
          </div>

          <div className="admin-event-list">
            <label className="admin-event-item" style={{ display: 'grid', gap: 8 }}>
              <strong>Subject *</strong>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => onChange('subject', e.target.value)}
                placeholder="What's happening this week"
              />
            </label>

            <label className="admin-event-item" style={{ display: 'grid', gap: 8 }}>
              <strong>Heading (optional)</strong>
              <input
                type="text"
                value={form.heading}
                onChange={(e) => onChange('heading', e.target.value)}
                placeholder="Defaults to the subject if left blank"
              />
            </label>

            <label className="admin-event-item" style={{ display: 'grid', gap: 8 }}>
              <strong>Message *</strong>
              <textarea
                rows={8}
                value={form.bodyText}
                onChange={(e) => onChange('bodyText', e.target.value)}
                placeholder="Write your update. Leave a blank line between paragraphs."
              />
            </label>

            <label className="admin-event-item" style={{ display: 'grid', gap: 8 }}>
              <strong>Hero image URL</strong>
              <input
                type="url"
                value={form.heroImageUrl}
                onChange={(e) => onChange('heroImageUrl', e.target.value)}
                placeholder="https://..."
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label className="admin-event-item" style={{ display: 'grid', gap: 8 }}>
                <strong>Button text</strong>
                <input
                  type="text"
                  value={form.ctaText}
                  onChange={(e) => onChange('ctaText', e.target.value)}
                  placeholder="See events"
                />
              </label>
              <label className="admin-event-item" style={{ display: 'grid', gap: 8 }}>
                <strong>Button link</strong>
                <input
                  type="url"
                  value={form.ctaUrl}
                  onChange={(e) => onChange('ctaUrl', e.target.value)}
                  placeholder="https://..."
                />
              </label>
            </div>
          </div>

          <label className="admin-event-item" style={{ display: 'grid', gap: 8, marginTop: '1rem' }}>
            <strong>Test email address(es)</strong>
            <input
              type="text"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com, teammate@example.com"
            />
          </label>

          <div style={{ display: 'flex', gap: 10, marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="admin-inline-btn"
              onClick={sendTest}
              disabled={!isValid || sendingTest || !testEmail.trim()}
            >
              {sendingTest ? 'Sending test...' : 'Send test'}
            </button>
            <button
              type="button"
              className="admin-primary-btn"
              onClick={() => setConfirmSend(true)}
              disabled={!isValid || !recipientCount}
            >
              <FiSend aria-hidden="true" />
              Send to {recipientCount ?? '...'} subscriber(s)
            </button>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="admin-panel-chip">Preview</span>
              <h2>How it'll look</h2>
            </div>
          </div>

          <div style={{ background: '#f4f7f4', borderRadius: 16, padding: '1.25rem' }}>
            <div style={{ background: '#fff', border: '1px solid #dbe7dd', borderRadius: 16, overflow: 'hidden' }}>
              <h3 style={{ margin: 0, padding: '1.25rem 1.25rem 0', textAlign: 'center', fontWeight: 800 }}>
                {form.heading || form.subject || 'Your headline'}
              </h3>
              {form.heroImageUrl ? (
                <img src={form.heroImageUrl} alt="" style={{ width: '100%', display: 'block', marginTop: '1rem' }} />
              ) : null}
              <div style={{ padding: '1.25rem' }}>
                <p style={{ whiteSpace: 'pre-line', color: '#475569', margin: 0 }}>
                  {form.bodyText || 'Your message will appear here.'}
                </p>
                {form.ctaText && form.ctaUrl ? (
                  <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: '#F97316',
                        color: '#fff',
                        fontWeight: 700,
                        padding: '12px 28px',
                        borderRadius: 999,
                      }}
                    >
                      {form.ctaText}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="admin-panel" style={{ marginTop: '1.5rem' }}>
        <div className="admin-panel-head">
          <div>
            <span className="admin-panel-chip">History</span>
            <h2>Past campaigns</h2>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-table-stacked">
            <thead>
              <tr>
                <th>Sent</th>
                <th>Subject</th>
                <th>Recipients</th>
                <th>Delivered</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-empty-state">No newsletters sent yet.</td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td data-label="Sent">{campaign.createdAt ? new Date(campaign.createdAt).toLocaleString() : '—'}</td>
                    <td data-label="Subject">{campaign.subject}</td>
                    <td data-label="Recipients">{campaign.recipientCount ?? 0}</td>
                    <td data-label="Delivered">
                      {campaign.sentCount ?? 0}
                      {campaign.failedCount ? ` (${campaign.failedCount} failed)` : ''}
                    </td>
                    <td data-label="Status">
                      <span className={`admin-status ${statusClass(campaign.status)}`}>
                        {statusLabel(campaign.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmSend ? (
        <div className="admin-card" style={{ marginTop: '1rem', padding: '1rem' }}>
          <strong>Send this newsletter to {recipientCount} subscriber(s)?</strong>
          <p style={{ marginTop: '.5rem' }}>
            This emails everyone who has ever bought a ticket, across every event. This can't be undone once sending starts.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="admin-inline-btn admin-inline-btn-approve" onClick={confirmAndSend}>
              Confirm and send
            </button>
            <button type="button" className="admin-inline-btn" onClick={() => setConfirmSend(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminNewsletter;
