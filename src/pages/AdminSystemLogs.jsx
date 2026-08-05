import React, { useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { CSVLink } from 'react-csv';
import { FiAlertCircle, FiCheckCircle, FiDownload, FiFilter, FiSearch, FiShield } from 'react-icons/fi';
import { database } from '../firebase/firebaseConfig.jsx';
import './admin-dashboard-troop.css';

const formatDateTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const getSeverityFromAction = (action) => {
  const normalized = String(action || '').toLowerCase();
  if (normalized.includes('delete') || normalized.includes('reject')) return 'high';
  if (normalized.includes('update') || normalized.includes('withdrawal') || normalized.includes('resend')) return 'medium';
  return 'low';
};

const getSeverityClass = (severity) => {
  if (severity === 'high') return 'admin-status-rejected';
  if (severity === 'medium') return 'admin-status-pending';
  return 'admin-status-completed';
};

const AdminSystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 15;

  React.useEffect(() => {
    const offAudit = onValue(ref(database, 'adminAudit'), (snapshot) => {
      const map = snapshot.val() || {};
      const rows = Object.entries(map)
        .map(([id, value]) => ({ id, ...value }))
        .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
      setLogs(rows);
    });

    return () => offAudit();
  }, []);

  const mappedLogs = useMemo(() => {
    return logs.map((entry) => ({
      ...entry,
      severity: getSeverityFromAction(entry.action),
      detailsPreview: entry.details ? JSON.stringify(entry.details) : '{}',
    }));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return mappedLogs.filter((entry) => {
      const severityMatch = severityFilter === 'all' ? true : entry.severity === severityFilter;
      if (!severityMatch) return false;

      if (!normalizedSearch) return true;
      const haystack = [entry.action, entry.uid, entry.detailsPreview]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [mappedLogs, searchTerm, severityFilter]);

  const totals = useMemo(() => {
    return {
      total: mappedLogs.length,
      high: mappedLogs.filter((entry) => entry.severity === 'high').length,
      medium: mappedLogs.filter((entry) => entry.severity === 'medium').length,
      low: mappedLogs.filter((entry) => entry.severity === 'low').length,
    };
  }, [mappedLogs]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [currentPage, filteredLogs]);

  const csvRows = useMemo(() => {
    return filteredLogs.map((entry) => ({
      timestamp: formatDateTime(entry.timestamp),
      severity: entry.severity,
      action: entry.action || '',
      uid: entry.uid || '',
      details: entry.detailsPreview,
    }));
  }, [filteredLogs]);

  const resetPage = () => setCurrentPage(1);

  return (
    <div className="admin-panel">
      <div className="admin-panel-head admin-transactions-header">
        <div>
          <span className="admin-panel-chip">Security</span>
          <h2>System logs</h2>
        </div>

        <div className="tx-pills">
          <div className="tx-pill">Total {totals.total}</div>
          <div className="tx-pill red">High {totals.high}</div>
          <div className="tx-pill amber">Medium {totals.medium}</div>
          <div className="tx-pill green">Low {totals.low}</div>
          <CSVLink data={csvRows} filename="admin-system-logs.csv" className="admin-primary-btn">
            <FiDownload aria-hidden="true" />
            Export Logs
          </CSVLink>
        </div>
      </div>

      <div className="admin-toolbar" style={{ marginBottom: '1rem' }}>
        <label className="admin-search" style={{ minWidth: '320px' }}>
          <FiSearch aria-hidden="true" />
          <input
            type="text"
            value={searchTerm}
            placeholder="Search by action, uid, or details"
            onChange={(event) => {
              setSearchTerm(event.target.value);
              resetPage();
            }}
          />
        </label>

        <label>
          Severity
          <select
            value={severityFilter}
            onChange={(event) => {
              setSeverityFilter(event.target.value);
              resetPage();
            }}
            style={{ marginLeft: 8 }}
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table admin-table-stacked">
          <thead>
            <tr>
              <th>Time</th>
              <th>Severity</th>
              <th>Action</th>
              <th>Admin UID</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-empty-state">No log entries match your filters.</td>
              </tr>
            ) : (
              paginatedLogs.map((entry) => (
                <tr key={entry.id}>
                  <td data-label="Time">{formatDateTime(entry.timestamp)}</td>
                  <td data-label="Severity">
                    <span className={`admin-status ${getSeverityClass(entry.severity)}`}>
                      {entry.severity}
                    </span>
                  </td>
                  <td data-label="Action">{entry.action || 'N/A'}</td>
                  <td data-label="Admin UID">{entry.uid || 'N/A'}</td>
                  <td data-label="Details">
                    <div style={{ maxWidth: 420, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {entry.detailsPreview}
                    </div>
                  </td>
                </tr>
              ))
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

      <div className="admin-panel" style={{ marginTop: '1rem', borderStyle: 'dashed' }}>
        <span className="admin-panel-chip">
          <FiFilter aria-hidden="true" />
          Investigation tip
        </span>
        <p className="admin-processed-note" style={{ marginTop: '.6rem' }}>
          High severity entries usually involve delete or reject actions. Export logs for external audits.
        </p>
      </div>
    </div>
  );
};

export default AdminSystemLogs;
