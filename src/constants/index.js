// Application constants
export const STORY_TYPES = {
  EPIC: 'Epic',
  TASK: 'Task',
  BUG: 'Bug'
};

export const PRIORITIES = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

export const STATUSES = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue'
};

export const JOB_ROLES = {
  UI: 'UI',
  BE: 'BE',
  QA: 'QA',
  DEVOPS: 'DevOps'
};

export const PRIORITY_COLORS = {
  [PRIORITIES.CRITICAL]: '#ef4444',
  [PRIORITIES.HIGH]: '#f97316',
  [PRIORITIES.MEDIUM]: '#ffc44d',
  [PRIORITIES.LOW]: '#22c55e'
};

export const THEME_COLORS = {
  PRIMARY: '#ffc44d',
  BACKGROUND: '#111827',
  CARD: '#1f2937',
  INPUT: '#374151'
};
