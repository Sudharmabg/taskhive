import React, { useEffect, useState } from 'react';
import { ClockIcon, TrashIcon } from '@heroicons/react/outline';
import apiService from '../../services/api';

const todayISO = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const fmtHours = (value) => {
  if (value == null || value === '') return '—';
  const n = Number(value);
  return `${Number.isInteger(n) ? n : n.toFixed(2).replace(/0$/, '')} h`;
};

/**
 * Estimate and daily time logs for a Task or Bug.
 * Assigned users (and admins) can set the estimate and log time; the backend enforces this.
 */
const TimeTrackingSection = ({ storyId, onChange }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estimateInput, setEstimateInput] = useState('');
  const [editingEstimate, setEditingEstimate] = useState(false);
  const [logForm, setLogForm] = useState({ workDate: todayISO(), hours: '', note: '' });
  const [saving, setSaving] = useState(false);

  const apply = (result) => {
    setData(result);
    setEstimateInput(result?.estimatedHours != null ? String(Number(result.estimatedHours)) : '');
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiService.getTimeTracking(storyId)
      .then(result => { if (!cancelled) apply(result); })
      .catch(err => { if (!cancelled) setError(`Failed to load time tracking: ${err.message}`); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storyId]);

  const run = async (action) => {
    setSaving(true);
    setError('');
    try {
      apply(await action());
      onChange && onChange();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveEstimate = async () => {
    const value = estimateInput.trim();
    if (value !== '' && !(Number(value) > 0)) {
      setError('Estimated hours must be greater than 0');
      return;
    }
    if (await run(() => apiService.setEstimate(storyId, value === '' ? null : value))) {
      setEditingEstimate(false);
    }
  };

  const submitLog = async () => {
    if (!(Number(logForm.hours) > 0)) {
      setError('Enter the hours worked (greater than 0)');
      return;
    }
    if (await run(() => apiService.logTime(storyId, logForm))) {
      setLogForm({ workDate: logForm.workDate, hours: '', note: '' });
    }
  };

  const removeLog = (log) => {
    if (!window.confirm(`Delete ${fmtHours(log.hours)} logged on ${log.workDate}?`)) return;
    run(() => apiService.deleteTimeLog(log.id));
  };

  if (loading) {
    return (
      <div>
        <h3 className="text-sm font-medium text-white mb-2">Time Tracking</h3>
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h3 className="text-sm font-medium text-white mb-2">Time Tracking</h3>
        <p className="text-sm text-red-400">{error || 'Time tracking is unavailable.'}</p>
      </div>
    );
  }

  const estimate = data.estimatedHours != null ? Number(data.estimatedHours) : null;
  const logged = Number(data.loggedHours || 0);
  const usedPct = estimate ? Math.min(100, Math.round((logged / estimate) * 100)) : 0;
  const over = estimate != null && logged > estimate;
  const inputClass = 'px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:border-transparent text-sm';
  const ring = { '--tw-ring-color': '#ffc44d' };

  return (
    <div>
      <h3 className="text-sm font-medium text-white mb-2 flex items-center">
        <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
        Time Tracking
      </h3>

      <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 space-y-4">
        {/* Totals */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-400">Estimated</div>
            {editingEstimate ? (
              <div className="flex items-center justify-center space-x-1 mt-1">
                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={estimateInput}
                  onChange={(e) => setEstimateInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveEstimate(); } }}
                  className={`${inputClass} w-20 py-1`}
                  style={ring}
                  aria-label="Estimated hours"
                  autoFocus
                />
                <button type="button" onClick={saveEstimate} disabled={saving}
                  className="px-2 py-1 rounded text-xs font-medium text-black disabled:opacity-50" style={{ backgroundColor: '#ffc44d' }}>
                  Save
                </button>
                <button type="button" onClick={() => { setEditingEstimate(false); apply(data); }}
                  className="px-2 py-1 rounded text-xs text-gray-300 hover:text-white">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="text-lg font-semibold text-white">
                {fmtHours(estimate)}
                {data.canEdit && (
                  <button type="button" onClick={() => setEditingEstimate(true)}
                    className="ml-2 text-xs font-normal hover:underline" style={{ color: '#ffc44d' }}>
                    {estimate == null ? 'Set' : 'Edit'}
                  </button>
                )}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-gray-400">Logged</div>
            <div className={`text-lg font-semibold ${over ? 'text-red-400' : 'text-white'}`}>{fmtHours(logged)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Remaining</div>
            <div className="text-lg font-semibold text-white">
              {estimate == null ? '—' : over ? <span className="text-red-400">{fmtHours(logged - estimate)} over</span> : fmtHours(data.remainingHours)}
            </div>
          </div>
        </div>

        {estimate != null && (
          <div className="w-full bg-gray-600 rounded-full h-2" title={`${usedPct}% of estimate used`}>
            <div className="h-2 rounded-full" style={{ width: `${usedPct}%`, backgroundColor: over ? '#f87171' : '#ffc44d' }} />
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Log time */}
        {data.canEdit ? (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              type="date"
              value={logForm.workDate}
              max={todayISO()}
              onChange={(e) => setLogForm(f => ({ ...f, workDate: e.target.value }))}
              className={`${inputClass} sm:col-span-4`}
              style={ring}
              aria-label="Date worked"
            />
            <input
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              placeholder="Hours"
              value={logForm.hours}
              onChange={(e) => setLogForm(f => ({ ...f, hours: e.target.value }))}
              className={`${inputClass} sm:col-span-2`}
              style={ring}
              aria-label="Hours worked"
            />
            <input
              type="text"
              placeholder="What did you work on? (optional)"
              maxLength={500}
              value={logForm.note}
              onChange={(e) => setLogForm(f => ({ ...f, note: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitLog(); } }}
              className={`${inputClass} sm:col-span-4`}
              style={ring}
              aria-label="Note"
            />
            <button
              type="button"
              onClick={submitLog}
              disabled={saving || !logForm.hours}
              className="sm:col-span-2 px-3 py-2 rounded-lg text-sm font-medium text-black disabled:opacity-50"
              style={{ backgroundColor: '#ffc44d' }}
            >
              Log time
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-400">Only the assigned users can set the estimate and log time.</p>
        )}

        {/* Entries */}
        {data.logs && data.logs.length > 0 ? (
          <ul className="divide-y divide-gray-600 border border-gray-600 rounded-lg max-h-48 overflow-y-auto">
            {data.logs.map(log => {
              const canDelete = data.isAdmin || log.userId === data.currentUserId;
              return (
                <li key={log.id} className="flex items-start justify-between px-3 py-2 bg-gray-800">
                  <div className="min-w-0">
                    <div className="text-sm text-white">
                      <span className="font-medium">{fmtHours(log.hours)}</span>
                      <span className="text-gray-400"> · {log.workDate} · {log.userName}</span>
                    </div>
                    {log.note && <div className="text-xs text-gray-300 break-words">{log.note}</div>}
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => removeLog(log)}
                      className="ml-2 text-gray-400 hover:text-red-400 flex-shrink-0"
                      aria-label={`Delete time entry from ${log.workDate}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-gray-400">No time logged yet.</p>
        )}
      </div>
    </div>
  );
};

export default TimeTrackingSection;
