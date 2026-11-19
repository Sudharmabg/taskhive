/**
 * Utility functions for story management
 */

// Company prefix - TODO: Make this configurable per organization
const COMPANY_PREFIX = 'EMP';

// Counters for each story type
let counters = {
  Epic: 1000,
  Task: 2000,
  Bug: 3000
};

/**
 * Generate unique story ID based on type
 * Format: {company}-{type_code}{number}
 * Examples: EMP-E1001, EMP-T2001, EMP-B3001
 */
export const generateStoryId = (type) => {
  const typeCodes = {
    Epic: 'E',
    Task: 'T', 
    Bug: 'B'
  };
  
  const typeCode = typeCodes[type] || 'S';
  const number = ++counters[type] || ++counters.Story || 1000;
  
  return `${COMPANY_PREFIX}-${typeCode}${number}`;
};

/**
 * Parse story ID to extract type and number
 */
export const parseStoryId = (storyId) => {
  const match = storyId.match(/^(\w+)-([ETB])(\d+)$/);
  if (!match) return null;
  
  const [, company, typeCode, number] = match;
  const types = { E: 'Epic', T: 'Task', B: 'Bug' };
  
  return {
    company,
    type: types[typeCode],
    number: parseInt(number),
    fullId: storyId
  };
};

/**
 * Get story URL path
 */
export const getStoryUrl = (storyId, type) => {
  const typeRoutes = {
    Epic: 'epics',
    Task: 'tasks', 
    Bug: 'bugs'
  };
  
  return `/app/${typeRoutes[type] || 'stories'}/${storyId}`;
};

/**
 * Page link for a story object. Uses the readable key (ABC-T0012) when present,
 * else the numeric id; type casing ("TASK", "task") doesn't matter.
 */
export const getStoryPath = (story) => {
  if (!story) return '/app/dashboard';
  const routes = { epic: 'epics', task: 'tasks', bug: 'bugs' };
  const route = routes[(story.type || '').toLowerCase()] || 'tasks';
  return `/app/${route}/${encodeURIComponent(story.storyId || story.id)}`;
};

/**
 * True once the deadline day has fully passed (local time).
 * A date-only deadline ("2026-11-16") stays on time for that whole day.
 */
export const isPastDeadline = (deadline) => {
  if (!deadline) return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(deadline));
  const end = m ? new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59, 999) : new Date(deadline);
  return !Number.isNaN(end.getTime()) && end < new Date();
};

/** Status as shown in the UI: an unfinished item past its deadline counts as Overdue. */
export const getEffectiveStatus = (story) => {
  if (!story) return '';
  if (story.status === 'Completed') return 'Completed';
  if (isPastDeadline(story.deadline)) return 'Overdue';
  return story.status || 'Pending';
};

/** Text a search matches against: ID, title, assignees, description, criteria. */
const searchableText = (story) =>
  [story.storyId, story.title, story.assigneeName, story.description, story.acceptanceCriteria, story.type]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

/**
 * Apply list filters. 'All' or an empty value means "don't filter".
 * Search is case-insensitive and every word must match.
 */
export const filterStories = (stories = [], { status, priority, search, type } = {}) => {
  const words = (search || '').toLowerCase().split(/\s+/).filter(Boolean);
  const active = (value) => value && value !== 'All';

  return stories.filter(story => {
    if (active(type) && (story.type || '').toLowerCase() !== type.toLowerCase()) return false;
    if (active(status) && getEffectiveStatus(story) !== status) return false;
    if (active(priority) && (story.priority || '').toLowerCase() !== priority.toLowerCase()) return false;
    if (words.length) {
      const text = searchableText(story);
      if (!words.every(word => text.includes(word))) return false;
    }
    return true;
  });
};

/** True when any list filter is set. */
export const hasActiveFilters = ({ status, priority, search, type } = {}) =>
  [status, priority, type].some(v => v && v !== 'All') || Boolean((search || '').trim());
