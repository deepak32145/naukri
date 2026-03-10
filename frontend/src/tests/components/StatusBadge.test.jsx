import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../../components/common/StatusBadge';

// StatusBadge has no Redux dependencies — plain render() is enough

describe('StatusBadge', () => {
  const cases = [
    { status: 'applied',              label: 'Applied',              colorClass: 'text-blue-700' },
    { status: 'under_review',         label: 'Under Review',         colorClass: 'text-yellow-700' },
    { status: 'shortlisted',          label: 'Shortlisted',          colorClass: 'text-purple-700' },
    { status: 'interview_scheduled',  label: 'Interview Scheduled',  colorClass: 'text-indigo-700' },
    { status: 'rejected',             label: 'Rejected',             colorClass: 'text-red-700' },
    { status: 'hired',                label: 'Hired',                colorClass: 'text-green-700' },
    { status: 'active',               label: 'Active',               colorClass: 'text-green-700' },
    { status: 'paused',               label: 'Paused',               colorClass: 'text-yellow-700' },
    { status: 'closed',               label: 'Closed',               colorClass: 'text-gray-700' },
    { status: 'draft',                label: 'Draft',                colorClass: 'text-gray-500' },
  ];

  cases.forEach(({ status, label, colorClass }) => {
    it(`renders "${label}" with correct color class for status "${status}"`, () => {
      render(<StatusBadge status={status} />);
      const badge = screen.getByText(label);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain(colorClass);
    });
  });

  it('falls back to gray for unknown status', () => {
    render(<StatusBadge status="unknown_status" />);
    const badge = screen.getByText('unknown_status');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-gray-700');
  });

  it('applies larger text class when size="lg"', () => {
    render(<StatusBadge status="applied" size="lg" />);
    const badge = screen.getByText('Applied');
    expect(badge.className).toContain('text-sm');
  });

  it('applies small text class by default (size="sm")', () => {
    render(<StatusBadge status="applied" />);
    const badge = screen.getByText('Applied');
    expect(badge.className).toContain('text-xs');
  });
});
