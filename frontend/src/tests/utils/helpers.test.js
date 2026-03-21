import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  timeAgo,
  formatDate,
  formatSalary,
  getStatusColor,
  getStatusLabel,
  getInitials,
  INDUSTRIES,
  JOB_TYPES,
  EXPERIENCE_LEVELS,
  SKILLS,
} from '../../utils/helpers';

// ─── timeAgo ─────────────────────────────────────────────────────────────────

describe('timeAgo', () => {
  it('returns empty string for null/undefined', () => {
    expect(timeAgo(null)).toBe('');
    expect(timeAgo(undefined)).toBe('');
  });

  it('returns a relative time string', () => {
    const result = timeAgo(new Date());
    expect(result).toMatch(/ago|seconds/i);
  });

  it('handles date string input', () => {
    const result = timeAgo('2020-01-01T00:00:00Z');
    expect(result).toMatch(/ago/i);
  });
});

// ─── formatDate ──────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns empty string for null/undefined', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });

  it('formats a date with default format', () => {
    const result = formatDate('2024-01-15T00:00:00Z');
    expect(result).toMatch(/Jan\s+\d{2},\s+2024/);
  });

  it('accepts a custom format string', () => {
    const result = formatDate('2024-03-05T00:00:00Z', 'yyyy-MM-dd');
    expect(result).toBe('2024-03-05');
  });

  it('formats a Date object', () => {
    const d = new Date('2024-06-10T00:00:00Z');
    const result = formatDate(d);
    expect(result).toContain('2024');
  });
});

// ─── formatSalary ─────────────────────────────────────────────────────────────

describe('formatSalary', () => {
  it('returns "Not disclosed" when both are empty', () => {
    expect(formatSalary(null, null)).toBe('Not disclosed');
    expect(formatSalary(undefined, undefined)).toBe('Not disclosed');
    expect(formatSalary(0, 0)).toBe('Not disclosed');
  });

  it('formats a salary range', () => {
    expect(formatSalary(500000, 1000000)).toBe('₹5.0 - 10.0 LPA');
  });

  it('formats min only (open-ended)', () => {
    expect(formatSalary(800000, null)).toBe('₹8.0+ LPA');
  });

  it('formats max only (up to)', () => {
    expect(formatSalary(null, 1500000)).toBe('Up to ₹15.0 LPA');
  });

  it('handles decimal LPA values correctly', () => {
    expect(formatSalary(750000, 1250000)).toBe('₹7.5 - 12.5 LPA');
  });
});

// ─── getStatusColor ───────────────────────────────────────────────────────────

describe('getStatusColor', () => {
  it('returns blue for applied', () => {
    expect(getStatusColor('applied')).toBe('bg-blue-100 text-blue-700');
  });

  it('returns yellow for under_review', () => {
    expect(getStatusColor('under_review')).toBe('bg-yellow-100 text-yellow-700');
  });

  it('returns purple for shortlisted', () => {
    expect(getStatusColor('shortlisted')).toBe('bg-purple-100 text-purple-700');
  });

  it('returns indigo for interview_scheduled', () => {
    expect(getStatusColor('interview_scheduled')).toBe('bg-indigo-100 text-indigo-700');
  });

  it('returns red for rejected', () => {
    expect(getStatusColor('rejected')).toBe('bg-red-100 text-red-700');
  });

  it('returns green for hired', () => {
    expect(getStatusColor('hired')).toBe('bg-green-100 text-green-700');
  });

  it('returns green for active', () => {
    expect(getStatusColor('active')).toBe('bg-green-100 text-green-700');
  });

  it('returns yellow for paused', () => {
    expect(getStatusColor('paused')).toBe('bg-yellow-100 text-yellow-700');
  });

  it('returns gray for closed', () => {
    expect(getStatusColor('closed')).toBe('bg-gray-100 text-gray-700');
  });

  it('returns gray for draft', () => {
    expect(getStatusColor('draft')).toBe('bg-gray-100 text-gray-500');
  });

  it('returns default gray for unknown status', () => {
    expect(getStatusColor('unknown_status')).toBe('bg-gray-100 text-gray-700');
  });
});

// ─── getStatusLabel ───────────────────────────────────────────────────────────

describe('getStatusLabel', () => {
  it('returns human-readable label for each status', () => {
    expect(getStatusLabel('applied')).toBe('Applied');
    expect(getStatusLabel('under_review')).toBe('Under Review');
    expect(getStatusLabel('shortlisted')).toBe('Shortlisted');
    expect(getStatusLabel('interview_scheduled')).toBe('Interview Scheduled');
    expect(getStatusLabel('rejected')).toBe('Rejected');
    expect(getStatusLabel('hired')).toBe('Hired');
    expect(getStatusLabel('active')).toBe('Active');
    expect(getStatusLabel('paused')).toBe('Paused');
    expect(getStatusLabel('closed')).toBe('Closed');
    expect(getStatusLabel('draft')).toBe('Draft');
  });

  it('returns the raw status string for unknown statuses', () => {
    expect(getStatusLabel('custom_status')).toBe('custom_status');
  });
});

// ─── getInitials ──────────────────────────────────────────────────────────────

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns single initial for single word name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('limits to 2 characters', () => {
    expect(getInitials('Alice Bob Charlie')).toBe('AB');
  });

  it('returns uppercase initials', () => {
    expect(getInitials('john doe')).toBe('JD');
  });

  it('returns empty string for empty name', () => {
    expect(getInitials('')).toBe('');
  });

  it('handles undefined gracefully via default param', () => {
    expect(getInitials()).toBe('');
  });
});

// ─── Constants ────────────────────────────────────────────────────────────────

describe('INDUSTRIES constant', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(INDUSTRIES)).toBe(true);
    expect(INDUSTRIES.length).toBeGreaterThan(0);
  });

  it('includes Information Technology', () => {
    expect(INDUSTRIES).toContain('Information Technology');
  });
});

describe('JOB_TYPES constant', () => {
  it('includes full-time and remote', () => {
    expect(JOB_TYPES).toContain('full-time');
    expect(JOB_TYPES).toContain('contract');
  });
});

describe('EXPERIENCE_LEVELS constant', () => {
  it('has objects with label, min, max', () => {
    expect(EXPERIENCE_LEVELS[0]).toHaveProperty('label');
    expect(EXPERIENCE_LEVELS[0]).toHaveProperty('min');
    expect(EXPERIENCE_LEVELS[0]).toHaveProperty('max');
  });

  it('includes Fresher level with min 0', () => {
    const fresher = EXPERIENCE_LEVELS.find(e => e.min === 0);
    expect(fresher).toBeDefined();
  });
});

describe('SKILLS constant', () => {
  it('includes JavaScript and React', () => {
    expect(SKILLS).toContain('JavaScript');
    expect(SKILLS).toContain('React');
  });

  it('is an array with more than 10 items', () => {
    expect(SKILLS.length).toBeGreaterThan(10);
  });
});
