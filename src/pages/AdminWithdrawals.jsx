import React, { useMemo, useState } from 'react';
import { ref, update } from 'firebase/database';
import { auth, database } from '../firebase/firebaseConfig.jsx';
import { adminApiUrl } from '../Utils/adminApi';
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

const AdminWithdrawals = () => {
  const { data, error, isLoading, refetch } = useAdminTransactions();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingAction, setPendingAction] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const itemsPerPage = 10;

  const withdrawals = data?.withdrawals || [];

  const counts = useMemo(() => {
    return {
      total: withdrawals.length,
      pending: withdrawals.filter((w) => normalizeStatus(w.status) === 'pending').length,
      approved: withdrawals.filter((w) => normalizeStatus(w.status) === 'approved').length,
      declined: withdrawals.filter((w) => normalizeStatus(w.status) === 'declined').length,
    };
  }, [withdrawals]);

  const filtered = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return withdrawals
      .filter((w) => {
        const matchesStatus = filter === 'all' ? true : normalizeStatus(w.status) === filter;
        if (!matchesStatus) return false;

        if (!normalizedSearch) return true;

        const searchable = [
          w.hostEmail,
          w.accountName,
          w.accountNumber,
          w.bank,
          w.eventTitle,
          w.note,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchable.includes(normalizedSearch);
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [filter, searchTerm, withdrawals]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  const paginatedWithdrawals = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [currentPage, filtered]);

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
    } catch (err) {
      console.warn('Failed to send audit log', err);
    }
  };

  const handleStatusUpdate = async (withdrawalId, nextStatus) => {
    try {
      setUpdatingId(withdrawalId);
      setFeedback({ type: '', message: '' });
      await update(ref(database, `withdrawalRequests/${withdrawalId}`), { status: nextStatus });
      await refetch();
      setFeedback({
        type: 'success',
        message: nextStatus === 'completed' ? 'Withdrawal approved.' : 'Withdrawal rejected.',
      });
      await sendAudit('withdrawal_update', { id: withdrawalId, status: nextStatus });
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update withdrawal status.' });
    } finally {
      setUpdatingId(null);
      setPendingAction(null);
    }
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const requestStatusUpdate = (withdrawalId, nextStatus) => {
    setPendingAction({ withdrawalId, nextStatus });
  };

  if (isLoading) return <div className="admin-panel">Loading withdrawal requests...</div>;
  if (error) return <div className="admin-panel">Error loading withdrawal requests.</div>;

  return (
    <div className="admin-panel">
      <div className="admin-panel-head admin-transactions-header">
        <div>
          <span className="admin-panel-chip">Payouts</span>
          <h2>Withdrawal requests</h2>
        </div>

        <div className="tx-pills">
          <div className="tx-pill">Total {counts.total}</div>
          <div className="tx-pill green">Pending {counts.pending}</div>
          <div className="tx-pill">Approved {counts.approved}</div>
          <div className="tx-pill red">Declined {counts.declined}</div>
          <label style={{ marginLeft: 8 }}>
            Status
            <select value={filter} onChange={(e) => handleFilterChange(e.target.value)} style={{ marginLeft: 6 }}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </label>
        </div>
      </div>

      <div className="admin-search" style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search by host, account, bank, event, or note"
          aria-label="Search withdrawal requests"
        />
      </div>

      {feedback.message ? (
        <p className={feedback.type === 'success' ? 'admin-value admin-value-emerald' : ''} style={feedback.type === 'error' ? { color: '#dc2626', fontWeight: 600 } : undefined}>
          {feedback.message}
        </p>
      ) : null}

      <div className="admin-table-wrap">
        <table className="admin-table admin-table-stacked">
          <thead>
            <tr>
              <th>Request Date</th>
              <th>Host</th>
              <th>Account Name</th>
              <th>Account No.</th>
              <th>Bank</th>
              <th>Amount</th>
              <th>Note</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="admin-empty-state">No withdrawal requests match this filter.</td>
              </tr>
            ) : (
              paginatedWithdrawals.map((withdrawal) => (
                <tr key={withdrawal.id}>
                  <td data-label="Request Date">
                    {withdrawal.timestamp ? new Date(withdrawal.timestamp).toLocaleString() : '—'}
                  </td>
                  <td data-label="Host">{withdrawal.hostEmail || '—'}</td>
                  <td data-label="Account Name">{withdrawal.accountName || '—'}</td>
                  <td data-label="Account No.">{withdrawal.accountNumber || '—'}</td>
                  <td data-label="Bank">{withdrawal.bank || '—'}</td>
                  <td data-label="Amount" className="admin-value admin-value-emerald">
                    {formatNaira(withdrawal.amount)}
                  </td>
                  <td data-label="Note">{withdrawal.note || '—'}</td>
                  <td data-label="Status">
                    <span className={`admin-status ${statusBadgeClass(withdrawal.status)}`}>
                      {normalizeStatus(withdrawal.status)}
                    </span>
                  </td>
                  <td data-label="Action">
                    {normalizeStatus(withdrawal.status) === 'pending' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="admin-inline-btn admin-inline-btn-approve"
                          onClick={() => requestStatusUpdate(withdrawal.id, 'completed')}
                          disabled={updatingId === withdrawal.id}
                        >
                          {updatingId === withdrawal.id ? 'Updating...' : 'Approve'}
                        </button>
                        <button
                          className="admin-inline-btn admin-inline-btn-reject"
                          onClick={() => requestStatusUpdate(withdrawal.id, 'rejected')}
                          disabled={updatingId === withdrawal.id}
                        >
                          {updatingId === withdrawal.id ? 'Updating...' : 'Reject'}
                        </button>
                      </div>
                    ) : (
                      <span className="admin-processed-note">Processed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > itemsPerPage ? (
        <div className="admin-pagination" style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="admin-page-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span style={{ alignSelf: 'center' }}>Page {currentPage} of {totalPages}</span>
          <button
            type="button"
            className="admin-page-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      ) : null}

      {pendingAction ? (
        <div className="admin-card" style={{ marginTop: '1rem', padding: '1rem' }}>
          <strong>
            {pendingAction.nextStatus === 'completed'
              ? 'Approve this withdrawal request?'
              : 'Reject this withdrawal request?'}
          </strong>
          <p style={{ marginTop: '.5rem' }}>
            This will update the payout status and create an admin audit entry.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="admin-inline-btn admin-inline-btn-approve"
              onClick={() => handleStatusUpdate(pendingAction.withdrawalId, pendingAction.nextStatus)}
            >
              Confirm
            </button>
            <button
              type="button"
              className="admin-inline-btn"
              onClick={() => setPendingAction(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminWithdrawals;
