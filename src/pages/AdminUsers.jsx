import React, { useMemo, useState } from 'react';
import { onValue, ref, update } from 'firebase/database';
import { FiSearch, FiShield, FiUser, FiUsers } from 'react-icons/fi';
import { auth, database } from '../firebase/firebaseConfig.jsx';
import { adminApiUrl } from '../Utils/adminApi';
import './admin-dashboard-troop.css';

const formatNaira = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [busyUid, setBusyUid] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const itemsPerPage = 10;

  React.useEffect(() => {
    const offUsers = onValue(ref(database, 'users'), (snapshot) => {
      const map = snapshot.val() || {};
      const rows = Object.entries(map).map(([uid, value]) => ({ uid, ...value }));
      setUsers(rows);
    });

    const offTickets = onValue(ref(database, 'tickets'), (snapshot) => {
      const map = snapshot.val() || {};
      const rows = Object.entries(map).map(([id, value]) => ({ id, ...value }));
      setTickets(rows);
    });

    const offWithdrawals = onValue(ref(database, 'withdrawalRequests'), (snapshot) => {
      const map = snapshot.val() || {};
      const rows = Object.entries(map).map(([id, value]) => ({ id, ...value }));
      setWithdrawals(rows);
    });

    return () => {
      offUsers();
      offTickets();
      offWithdrawals();
    };
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

  const userMetrics = useMemo(() => {
    const byEmail = {};

    tickets.forEach((ticket) => {
      const email = (ticket.email || '').toLowerCase();
      if (!email) return;
      if (!byEmail[email]) {
        byEmail[email] = { ticketsBought: 0, spend: 0, hostSales: 0, hostRevenue: 0, withdrawn: 0 };
      }
      byEmail[email].ticketsBought += ticket.quantity || 1;
      byEmail[email].spend += ticket.totalCharged || ticket.totalPaid || 0;
    });

    tickets.forEach((ticket) => {
      const host = (ticket.hostEmail || '').toLowerCase();
      if (!host) return;
      if (!byEmail[host]) {
        byEmail[host] = { ticketsBought: 0, spend: 0, hostSales: 0, hostRevenue: 0, withdrawn: 0 };
      }
      byEmail[host].hostSales += ticket.quantity || 1;
      byEmail[host].hostRevenue += ticket.totalPaid || 0;
    });

    withdrawals.forEach((withdrawal) => {
      if (withdrawal.status !== 'completed') return;
      const host = (withdrawal.hostEmail || '').toLowerCase();
      if (!host) return;
      if (!byEmail[host]) {
        byEmail[host] = { ticketsBought: 0, spend: 0, hostSales: 0, hostRevenue: 0, withdrawn: 0 };
      }
      byEmail[host].withdrawn += withdrawal.amount || 0;
    });

    return byEmail;
  }, [tickets, withdrawals]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users
      .filter((user) => {
        const role = (user.role || 'user').toLowerCase();
        const matchesRole = roleFilter === 'all' ? true : role === roleFilter;
        if (!matchesRole) return false;

        if (!normalizedSearch) return true;
        const haystack = [user.name, user.email, user.role, user.uid].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(normalizedSearch);
      })
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  }, [roleFilter, searchTerm, users]);

  const totals = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((user) => user.role === 'admin').length,
      hosts: users.filter((user) => user.role === 'host').length,
      users: users.filter((user) => !user.role || user.role === 'user').length,
    };
  }, [users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [currentPage, filteredUsers]);

  const setRole = async (uid, nextRole) => {
    const user = users.find((item) => item.uid === uid);
    if (!user) return;

    if (!window.confirm(`Change role for ${user.email || user.name || uid} to ${nextRole}?`)) return;

    try {
      setBusyUid(uid);
      setFeedback({ type: '', message: '' });
      await update(ref(database, `users/${uid}`), { role: nextRole });
      await sendAudit('user_role_update', {
        uid,
        email: user.email || '',
        previousRole: user.role || 'user',
        nextRole,
      });
      setFeedback({ type: 'success', message: `Role updated to ${nextRole}.` });
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Failed to update role.' });
    } finally {
      setBusyUid('');
    }
  };

  const onSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const onRoleChange = (value) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-head admin-transactions-header">
        <div>
          <span className="admin-panel-chip">Identity</span>
          <h2>Users management</h2>
        </div>

        <div className="tx-pills">
          <div className="tx-pill">Total {totals.total}</div>
          <div className="tx-pill green">Hosts {totals.hosts}</div>
          <div className="tx-pill amber">Admins {totals.admins}</div>
          <div className="tx-pill">Users {totals.users}</div>
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

      <div className="admin-toolbar" style={{ marginBottom: '1rem' }}>
        <label className="admin-search" style={{ minWidth: '320px' }}>
          <FiSearch aria-hidden="true" />
          <input
            type="text"
            value={searchTerm}
            placeholder="Search by name, email, role, uid"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>

        <label>
          Role
          <select value={roleFilter} onChange={(event) => onRoleChange(event.target.value)} style={{ marginLeft: 8 }}>
            <option value="all">All</option>
            <option value="admin">Admin</option>
            <option value="host">Host</option>
            <option value="user">User</option>
          </select>
        </label>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table admin-table-stacked">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Buyer Activity</th>
              <th>Host Activity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty-state">No users match your filters.</td>
              </tr>
            ) : (
              paginatedUsers.map((user) => {
                const metrics = userMetrics[(user.email || '').toLowerCase()] || {
                  ticketsBought: 0,
                  spend: 0,
                  hostSales: 0,
                  hostRevenue: 0,
                  withdrawn: 0,
                };

                return (
                  <tr key={user.uid}>
                    <td data-label="User">
                      <strong>{user.name || 'Unnamed user'}</strong>
                      <div className="admin-processed-note">{user.email || user.uid}</div>
                    </td>
                    <td data-label="Role">
                      <span className={`admin-status admin-status-${user.role === 'admin' ? 'approved' : user.role === 'host' ? 'completed' : 'pending'}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td data-label="Joined">{formatDate(user.createdAt)}</td>
                    <td data-label="Buyer Activity">
                      <div className="admin-value">{metrics.ticketsBought} tickets</div>
                      <div className="admin-processed-note">Spend {formatNaira(metrics.spend)}</div>
                    </td>
                    <td data-label="Host Activity">
                      <div className="admin-value admin-value-blue">{metrics.hostSales} sold</div>
                      <div className="admin-processed-note">Net {formatNaira(metrics.hostRevenue)}</div>
                      <div className="admin-processed-note">Withdrawn {formatNaira(metrics.withdrawn)}</div>
                    </td>
                    <td data-label="Actions">
                      <div className="admin-action-row" style={{ gap: 6 }}>
                        <button
                          type="button"
                          className="admin-inline-btn"
                          disabled={busyUid === user.uid || user.role === 'user'}
                          onClick={() => setRole(user.uid, 'user')}
                        >
                          <FiUser aria-hidden="true" />
                          User
                        </button>
                        <button
                          type="button"
                          className="admin-inline-btn admin-inline-btn-approve"
                          disabled={busyUid === user.uid || user.role === 'host'}
                          onClick={() => setRole(user.uid, 'host')}
                        >
                          <FiUsers aria-hidden="true" />
                          Host
                        </button>
                        <button
                          type="button"
                          className="admin-inline-btn admin-inline-btn-amber"
                          disabled={busyUid === user.uid || user.role === 'admin'}
                          onClick={() => setRole(user.uid, 'admin')}
                        >
                          <FiShield aria-hidden="true" />
                          Admin
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="admin-pagination" style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="admin-page-btn"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>

          <span style={{ alignSelf: 'center' }}>Page {currentPage} of {totalPages}</span>

          <button
            type="button"
            className="admin-page-btn"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default AdminUsers;
