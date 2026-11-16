import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarIcon, PlusIcon } from '@heroicons/react/outline';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import { formatDateTime } from '../../components/common/StoryHistory';

export const LEAVE_TYPES = [
  { value: 'CASUAL', label: 'Casual' },
  { value: 'SICK', label: 'Sick' },
  { value: 'EARNED', label: 'Earned' },
  { value: 'UNPAID', label: 'Unpaid' },
];

const STATUS_STYLES = {
  PENDING: { label: 'Pending', style: 'bg-yellow-500 text-black' },
  APPROVED: { label: 'Approved', style: 'bg-green-600 text-white' },
  REJECTED: { label: 'Rejected', style: 'bg-red-600 text-white' },
  CANCELLED: { label: 'Cancelled', style: 'bg-gray-600 text-gray-200' },
};

const fieldClass = 'w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent';
const ring = { '--tw-ring-color': '#ffc44d' };
const thClass = 'px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider';

const typeLabel = (value) => (LEAVE_TYPES.find(t => t.value === value) || {}).label || value;

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => toISO(new Date());

/** Parses "YYYY-MM-DD" as a local date (new Date(string) would treat it as UTC). */
const parseDay = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
};

const formatDay = (value) => {
  const d = parseDay(value);
  return d ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : value || '';
};

const formatRange = (leave) => (leave.startDate === leave.endDate
  ? `${formatDay(leave.startDate)}${leave.halfDay ? ' (half day)' : ''}`
  : `${formatDay(leave.startDate)} – ${formatDay(leave.endDate)}`);

/** Mon–Fri days in the range; mirrors the backend count. */
const workingDays = (start, end) => {
  const s = parseDay(start);
  const e = parseDay(end);
  if (!s || !e || e < s) return 0;
  let count = 0;
  for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0 && d.getDay() !== 6) count += 1;
  }
  return count;
};

const fmtDays = (n) => {
  const v = Number(n || 0);
  return `${Number.isInteger(v) ? v : v.toFixed(1)} day${v === 1 ? '' : 's'}`;
};

const StatusBadge = ({ status }) => {
  const info = STATUS_STYLES[status] || { label: status, style: 'bg-gray-600 text-white' };
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${info.style}`}>{info.label}</span>;
};

/** Apply for leave. */
const ApplyLeaveModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ type: 'CASUAL', startDate: todayISO(), endDate: todayISO(), halfDay: false, reason: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const singleDay = form.startDate && form.startDate === form.endDate;
  const days = form.halfDay && singleDay ? 0.5 : workingDays(form.startDate, form.endDate);

  const set = (name, value) => setForm(f => {
    const next = { ...f, [name]: value };
    // Keep the end date from falling before the start date
    if (name === 'startDate' && next.endDate && value > next.endDate) next.endDate = value;
    if (next.startDate !== next.endDate) next.halfDay = false;
    return next;
  });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      setError('Choose the start and end dates');
      return;
    }
    if (form.endDate < form.startDate) {
      setError("End date can't be before the start date");
      return;
    }
    if (days === 0) {
      setError('These dates fall on a weekend; no leave is needed');
      return;
    }
    setSaving(true);
    setError('');
    try {
      onSaved(await apiService.applyLeave(form));
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Apply for leave">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="leave-type" className="block text-sm font-medium text-gray-300 mb-1">Leave type</label>
          <select id="leave-type" value={form.type} onChange={(e) => set('type', e.target.value)} className={fieldClass} style={ring}>
            {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="leave-start" className="block text-sm font-medium text-gray-300 mb-1">From</label>
            <input id="leave-start" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={fieldClass} style={ring} />
          </div>
          <div>
            <label htmlFor="leave-end" className="block text-sm font-medium text-gray-300 mb-1">To</label>
            <input id="leave-end" type="date" value={form.endDate} min={form.startDate} onChange={(e) => set('endDate', e.target.value)} className={fieldClass} style={ring} />
          </div>
        </div>
        <label className={`flex items-center text-sm ${singleDay ? 'text-gray-300 cursor-pointer' : 'text-gray-500'}`}>
          <input
            type="checkbox"
            className="mr-2 rounded"
            checked={form.halfDay}
            disabled={!singleDay}
            onChange={(e) => set('halfDay', e.target.checked)}
          />
          Half day {!singleDay && <span className="ml-1 text-xs">(single day only)</span>}
        </label>
        <div>
          <label htmlFor="leave-reason" className="block text-sm font-medium text-gray-300 mb-1">Reason (optional)</label>
          <textarea
            id="leave-reason"
            rows={3}
            maxLength={500}
            value={form.reason}
            onChange={(e) => set('reason', e.target.value)}
            className={fieldClass}
            style={ring}
          />
        </div>
        <p className="text-sm text-gray-300">
          Working days requested: <span className="font-semibold text-white">{fmtDays(days)}</span>
          <span className="text-gray-400"> (weekends are not counted)</span>
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Submitting...' : 'Submit request'}</Button>
        </div>
      </form>
    </Modal>
  );
};

/** Admin approves or rejects a request, with an optional note. */
const ReviewLeaveModal = ({ leave, decision, onClose, onSaved }) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const approving = decision === 'APPROVED';

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      onSaved(await apiService.reviewLeave(leave.id, decision, note));
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={approving ? 'Approve leave' : 'Reject leave'} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-300">
          <span className="text-white font-medium">{leave.userName}</span> · {typeLabel(leave.type)} · {formatRange(leave)} · {fmtDays(leave.days)}
        </p>
        {leave.reason && <p className="text-sm text-gray-400 whitespace-pre-line break-words">“{leave.reason}”</p>}
        <div>
          <label htmlFor="review-note" className="block text-sm font-medium text-gray-300 mb-1">Note to {leave.userName} (optional)</label>
          <textarea id="review-note" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={fieldClass} style={ring} />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={approving ? 'primary' : 'danger'} disabled={saving}>
            {saving ? 'Saving...' : approving ? 'Approve' : 'Reject'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

/** Who is on approved leave today and over the next two weeks. */
const WhosAway = ({ entries }) => (
  <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
    <h2 className="text-sm font-semibold text-white mb-3 flex items-center">
      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
      Who's away (next 14 days)
    </h2>
    {entries.length === 0 ? (
      <p className="text-sm text-gray-400">Everyone is in.</p>
    ) : (
      <ul className="space-y-2">
        {entries.map(e => (
          <li key={e.id} className="flex items-center justify-between text-sm gap-3">
            <span className="text-white truncate">{e.userName}</span>
            <span className={`whitespace-nowrap ${e.onLeaveToday ? 'font-medium' : 'text-gray-400'}`} style={e.onLeaveToday ? { color: '#ffc44d' } : {}}>
              {e.onLeaveToday ? 'Today · ' : ''}{formatRange(e)}
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

/**
 * Leave: apply for and track your own leave; admins also review everyone's requests.
 */
const LeavePage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const [tab, setTab] = useState('mine');
  const [mine, setMine] = useState({ requests: [], summary: {}, year: new Date().getFullYear() });
  const [away, setAway] = useState([]);
  const [all, setAll] = useState([]);
  const [adminFilter, setAdminFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [applying, setApplying] = useState(false);
  const [reviewing, setReviewing] = useState(null); // { leave, decision }

  const load = useCallback(async () => {
    try {
      const [mineData, awayData, allData] = await Promise.all([
        apiService.getMyLeaves(),
        apiService.getUpcomingLeaves(14),
        isAdmin ? apiService.getAllLeaves() : Promise.resolve([]),
      ]);
      setMine(mineData);
      setAway(Array.isArray(awayData) ? awayData : []);
      setAll(Array.isArray(allData) ? allData : []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const pendingCount = useMemo(() => all.filter(l => l.status === 'PENDING').length, [all]);
  const adminRows = useMemo(
    () => (adminFilter ? all.filter(l => l.status === adminFilter) : all),
    [all, adminFilter]
  );

  const canCancel = (leave) => {
    if (leave.status === 'PENDING') return true;
    return leave.status === 'APPROVED' && leave.startDate > todayISO();
  };

  const cancel = async (leave) => {
    if (!window.confirm(`Cancel your ${typeLabel(leave.type).toLowerCase()} leave for ${formatRange(leave)}?`)) return;
    setBusyId(leave.id);
    setActionError('');
    try {
      await apiService.cancelLeave(leave.id);
      await load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const afterChange = async () => {
    setApplying(false);
    setReviewing(null);
    await load();
  };

  if (loading) return <div className="text-center py-12 text-gray-300">Loading leave...</div>;
  if (error) return <div className="text-center py-12 text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Leave</h1>
          <p className="text-gray-300">Apply for time off and see who's away</p>
        </div>
        <Button variant="primary" onClick={() => setApplying(true)} className="flex items-center">
          <PlusIcon className="h-4 w-4 mr-2" />
          Apply for leave
        </Button>
      </div>

      {isAdmin && (
        <div className="flex gap-2" role="tablist" aria-label="Leave views">
          {[{ id: 'mine', label: 'My leave' }, { id: 'review', label: 'Team requests', badge: pendingCount }].map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'text-black' : 'text-gray-300 bg-gray-800 border border-gray-700 hover:text-white'
              }`}
              style={tab === t.id ? { backgroundColor: '#ffc44d' } : {}}
            >
              {t.label}
              {t.badge > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${tab === t.id ? 'bg-black/20' : 'bg-red-600 text-white'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {actionError && <p className="text-sm text-red-400" role="alert">{actionError}</p>}

      {tab === 'mine' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              {LEAVE_TYPES.map(t => {
                const row = (mine.summary || {})[t.value] || {};
                return (
                  <div key={t.value} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <p className="text-xs text-gray-400">{t.label} taken in {mine.year}</p>
                    <p className="text-2xl font-bold text-white mt-1">{fmtDays(row.approved)}</p>
                    {Number(row.pending) > 0 && (
                      <p className="text-xs text-yellow-400 mt-1">{fmtDays(row.pending)} pending</p>
                    )}
                  </div>
                );
              })}
            </div>
            <WhosAway entries={away} />
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-5 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">My requests</h2>
            </div>
            {mine.requests.length === 0 ? (
              <p className="p-6 text-center text-gray-400">You haven't applied for any leave yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      {['Type', 'Dates', 'Days', 'Status', 'Reason / note', ''].map((h, i) => (
                        <th key={i} className={thClass}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {mine.requests.map(l => (
                      <tr key={l.id} className="align-top">
                        <td className="px-4 py-3 text-sm text-white whitespace-nowrap">{typeLabel(l.type)}</td>
                        <td className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">{formatRange(l)}</td>
                        <td className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">{fmtDays(l.days)}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={l.status} /></td>
                        <td className="px-4 py-3 text-sm text-gray-300 max-w-sm">
                          {l.reason && <div className="break-words">{l.reason}</div>}
                          {l.reviewedByName && (
                            <div className="text-xs text-gray-400 mt-1 break-words">
                              {l.reviewedByName}{l.reviewNote ? `: ${l.reviewNote}` : ''} · {formatDateTime(l.reviewedAt)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {canCancel(l) && (
                            <Button size="sm" variant="outline" disabled={busyId === l.id} onClick={() => cancel(l)}>
                              {busyId === l.id ? 'Cancelling...' : 'Cancel'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-5 border-b border-gray-700 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Team requests</h2>
            <select value={adminFilter} onChange={(e) => setAdminFilter(e.target.value)} className={`${fieldClass} w-auto`} style={ring} aria-label="Filter by status">
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="">All</option>
            </select>
          </div>
          {adminRows.length === 0 ? (
            <p className="p-6 text-center text-gray-400">
              {adminFilter === 'PENDING' ? 'No requests waiting for review.' : 'No requests here.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    {['Employee', 'Type', 'Dates', 'Days', 'Status', 'Reason', 'Applied', ''].map((h, i) => (
                      <th key={i} className={thClass}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {adminRows.map(l => (
                    <tr key={l.id} className="align-top">
                      <td className="px-4 py-3 text-sm text-white whitespace-nowrap">{l.userName}</td>
                      <td className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">{typeLabel(l.type)}</td>
                      <td className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">{formatRange(l)}</td>
                      <td className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">{fmtDays(l.days)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={l.status} />
                        {l.reviewedByName && <div className="text-xs text-gray-400 mt-1">by {l.reviewedByName}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 max-w-xs break-words">{l.reason || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                        {l.status === 'PENDING' && (
                          <>
                            <Button size="sm" variant="primary" onClick={() => setReviewing({ leave: l, decision: 'APPROVED' })}>Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => setReviewing({ leave: l, decision: 'REJECTED' })}>Reject</Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {applying && <ApplyLeaveModal onClose={() => setApplying(false)} onSaved={afterChange} />}
      {reviewing && (
        <ReviewLeaveModal
          leave={reviewing.leave}
          decision={reviewing.decision}
          onClose={() => setReviewing(null)}
          onSaved={afterChange}
        />
      )}
    </div>
  );
};

export default LeavePage;
