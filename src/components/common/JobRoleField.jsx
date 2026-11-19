import React, { useState } from 'react';

/** Preset job roles; the value is what's stored, the label is what's shown. */
export const JOB_ROLES = [
  { value: 'UI', label: 'UI' },
  { value: 'BE', label: 'BE' },
  { value: 'QA', label: 'QA' },
  { value: 'DevOps', label: 'DevOps' },
  { value: 'FullStack', label: 'Full Stack Developer' },
  { value: 'AI', label: 'AI' },
];

const OTHER = '__other__';
const MAX_LENGTH = 50;

export const jobRoleLabel = (value) =>
  (JOB_ROLES.find(r => r.value.toLowerCase() === (value || '').toLowerCase()) || {}).label || value || '—';

const isPreset = (value) => JOB_ROLES.some(r => r.value.toLowerCase() === (value || '').toLowerCase());

/**
 * Job role picker: choose a preset, or "Other" to type a custom role (e.g. "Product Manager").
 * Calls onChange with the role text; an empty string means nothing chosen yet.
 */
const JobRoleField = ({ id = 'job-role', value, onChange, error, required = true }) => {
  // Show the text box when the current value is a custom role
  const [custom, setCustom] = useState(Boolean(value) && !isPreset(value));
  const selectValue = custom ? OTHER : (JOB_ROLES.find(r => r.value.toLowerCase() === (value || '').toLowerCase())?.value || '');
  const ring = { '--tw-ring-color': error ? '#ef4444' : '#ffc44d' };
  const fieldClass = `w-full px-3 py-2 bg-gray-700 border text-white rounded-lg focus:ring-2 focus:border-transparent ${error ? 'border-red-400' : 'border-gray-600'}`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
        Job Role {required && <span className="text-red-400">*</span>}
      </label>
      <select
        id={id}
        value={selectValue}
        onChange={(e) => {
          if (e.target.value === OTHER) {
            setCustom(true);
            onChange(isPreset(value) ? '' : value || '');
          } else {
            setCustom(false);
            onChange(e.target.value);
          }
        }}
        className={fieldClass}
        style={ring}
      >
        <option value="">Select job role</option>
        {JOB_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        <option value={OTHER}>Other (type your own)</option>
      </select>
      {custom && (
        <input
          type="text"
          aria-label="Custom job role"
          value={value || ''}
          maxLength={MAX_LENGTH}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Product Manager"
          className={`${fieldClass} mt-2 placeholder-gray-400`}
          style={ring}
          autoFocus
        />
      )}
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};

export default JobRoleField;
