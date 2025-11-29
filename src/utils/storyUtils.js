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