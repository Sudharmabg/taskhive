import React from 'react';
import { ClipboardListIcon, CollectionIcon, ExclamationIcon } from '@heroicons/react/outline';

/** One look per work-item type, used everywhere Epics, Tasks and Bugs appear together. */
const TYPES = {
  epic: { label: 'Epic', icon: CollectionIcon, className: 'bg-purple-800 text-purple-100 border-purple-500' },
  task: { label: 'Task', icon: ClipboardListIcon, className: 'bg-blue-800 text-blue-100 border-blue-500' },
  bug: { label: 'Bug', icon: ExclamationIcon, className: 'bg-red-800 text-red-100 border-red-500' },
};

const FALLBACK = { label: 'Item', icon: ClipboardListIcon, className: 'bg-gray-700 text-gray-200 border-gray-500' };

/** Types arrive as "Task", "TASK", "task"... */
export const typeInfo = (type) => TYPES[(type || '').toString().trim().toLowerCase()] || { ...FALLBACK, label: type || FALLBACK.label };

/**
 * Coloured Epic / Task / Bug tag with an icon, so the type is clear at a glance
 * (colour plus icon plus text, not colour alone).
 */
const TypeBadge = ({ type, size = 'sm', className = '' }) => {
  const info = typeInfo(type);
  const Icon = info.icon;
  const sizing = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-semibold uppercase tracking-wide whitespace-nowrap ${sizing} ${info.className} ${className}`}>
      <Icon className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden="true" />
      {info.label}
    </span>
  );
};

export default TypeBadge;
