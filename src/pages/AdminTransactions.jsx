import React, { useMemo, useState } from 'react';
import { ref, update } from 'firebase/database';
import { database } from '../firebase/firebaseConfig.jsx';
import { useAdminTransactions } from '../hooks/useAdminTransactions';
import './admin-dashboard-troop.css';

const formatNaira = (v) => `NGN ${Number(v || 0).toLocaleString()}`;

const normalizeStatus = (status) => {
  if (status === 'completed' || status === 'approved') return 'approved';
  if (status === 'rejected' || status === 'declined') return 'declined';
  return 'pending';
};

const statusBadgeClass = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === 'approved') return 'admin-status-completed';
  if (normalized === 'declined') return 'admin-status-rejected';
  return 'admin-status-pending';
};

const AdminTransactions = () => {
  const { data, error, isLoading, refetch } = useAdminTransactions();
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const withdrawals = data?.withdrawals || [];
  const transactions = data?.transactions || [];

  const counts = useMemo(() => {
    return {
      totalRequests: withdrawals.length,
      pending: withdrawals.filter((w) => normalizeStatus(w.status) === 'pending').length,
      approved: withdrawals.filter((w) => normalizeStatus(w.status) === 'approved').length,
      declined: withdrawals.filter((w) => normalizeStatus(w.status) === 'declined').length,
    };
  }, [withdrawals]);

  const handleWithdrawalStatus = async (withdrawalId, nextStatus) => {
    try {
      setUpdatingId(withdrawalId);
      setActionError('');
      setActionMessage('');
      await update(ref(database, `withdrawalRequests/${withdrawalId}`), { status: nextStatus });
      await refetch();
      setActionMessage(nextStatus === 'completed' ? 'Withdrawal approved.' : 'Withdrawal rejected.');
    } catch (err) {
      setActionError(err?.message || 'Failed to update withdrawal status.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) return <div className="admin-panel">Loading transactions...</div>;
  if (error) return <div className="admin-panel">Error loading transactions. Please try again.</div>;

  const filtered = withdrawals.filter((w) => {
    const normalized = normalizeStatus(w.status);
    if (filter === 'all') return true;
    return normalized === filter;
  });

  return (
    <div className="admin-panel">
      <div className="admin-panel-head admin-transactions-header">
        <div>
          <span className="admin-panel-chip">Transactions</span>
          <h2>Manage all transactions</h2>
        </div>

        <div className="tx-pills">
          <div className="tx-pill">Total Requests {counts.totalRequests}</div>
          <div className="tx-pill green">Pending {counts.pending}</div>
          <div className="tx-pill">Approved {counts.approved}</div>
          <div className="tx-pill red">Declined {counts.declined}</div>
          <div>
            <label style={{ marginLeft: 8 }}>
              Status
              <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ marginLeft: 6 }}>
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {actionMessage ? <p className="admin-value admin-value-emerald">{actionMessage}</p> : null}
      {actionError ? <p style={{ color: '#dc2626', fontWeight: 600 }}>{actionError}</p> : null}

      <div className="admin-table-wrap">
        <table className="admin-table admin-table-stacked">
          <thead>
            <tr>
              <th>Requestor</th>
              <th>Event</th>
              <th>Amount</th>
              <th>Request Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty-state">No withdrawal requests match this filter.</td>
              </tr>
            ) : filtered.map(w => (
              <tr key={w.id}>
                <td data-label="Requestor">{w.hostEmail || w.requestorName || '—'}</td>
                <td data-label="Event">{w.eventTitle || w.eventId || '—'}</td>
                <td data-label="Amount" className="admin-value admin-value-emerald">{formatNaira(w.amount)}</td>
                <td data-label="Request Date">{w.timestamp ? new Date(w.timestamp).toLocaleString() : '—'}</td>
                <td data-label="Status">
                  <span className={`admin-status ${statusBadgeClass(w.status)}`}>{normalizeStatus(w.status)}</span>
                </td>
                <td data-label="Action">
                  {normalizeStatus(w.status) === 'pending' ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="admin-inline-btn admin-inline-btn-approve"
                        onClick={() => handleWithdrawalStatus(w.id, 'completed')}
                        disabled={updatingId === w.id}
                      >
                        {updatingId === w.id ? 'Updating...' : 'Approve'}
                      </button>
                      <button
                        className="admin-inline-btn admin-inline-btn-reject"
                        onClick={() => handleWithdrawalStatus(w.id, 'rejected')}
                        disabled={updatingId === w.id}
                      >
                        {updatingId === w.id ? 'Updating...' : 'Reject'}
                      </button>
                    </div>
                  ) : (
                    <span className="admin-processed-note">Processed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 18 }}>
        <h3>Recent transactions</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty-state">No recent transactions available yet.</td>
                </tr>
              ) : transactions.slice(0, 12).map(t => (
                <tr key={t.id}>
                  <td>{t.reference}</td>
                  <td>{t.type}</td>
                  <td>{t.description}</td>
                  <td className="admin-value admin-value-emerald">{formatNaira(t.amount)}</td>
                  <td>{t.date ? new Date(t.date).toLocaleString() : '—'}</td>
                  <td><span className="admin-status admin-status-completed">{t.status || 'Success'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTransactions;
