import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileCompleteness from '../../components/common/ProfileCompleteness';

describe('ProfileCompleteness component', () => {
  it('renders the score percentage', () => {
    render(<ProfileCompleteness score={75} />);
    expect(screen.getByText('75%')).toBeTruthy();
  });

  it('renders "Profile Strength" label', () => {
    render(<ProfileCompleteness score={50} />);
    expect(screen.getByText('Profile Strength')).toBeTruthy();
  });

  // ─── Score threshold messages ─────────────────────────────────────────────

  it('shows "Excellent!" for score >= 80', () => {
    render(<ProfileCompleteness score={80} />);
    expect(screen.getByText('Excellent!')).toBeTruthy();
  });

  it('shows "Excellent!" for score 100', () => {
    render(<ProfileCompleteness score={100} />);
    expect(screen.getByText('Excellent!')).toBeTruthy();
  });

  it('shows "Good — keep going" for score >= 50 and < 80', () => {
    render(<ProfileCompleteness score={60} />);
    expect(screen.getByText('Good — keep going')).toBeTruthy();
  });

  it('shows "Good — keep going" for score exactly 50', () => {
    render(<ProfileCompleteness score={50} />);
    expect(screen.getByText('Good — keep going')).toBeTruthy();
  });

  it('shows "Complete your profile" for score < 50', () => {
    render(<ProfileCompleteness score={30} />);
    expect(screen.getByText('Complete your profile')).toBeTruthy();
  });

  it('shows "Complete your profile" for score 0', () => {
    render(<ProfileCompleteness score={0} />);
    expect(screen.getByText('Complete your profile')).toBeTruthy();
  });

  // ─── SVG rendering ───────────────────────────────────────────────────────

  it('renders an SVG element', () => {
    const { container } = render(<ProfileCompleteness score={65} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders two circles in the SVG', () => {
    const { container } = render(<ProfileCompleteness score={65} />);
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(2);
  });

  // ─── Color thresholds (via inline style on score text) ───────────────────

  it('uses green color for score >= 80', () => {
    const { container } = render(<ProfileCompleteness score={80} />);
    const scoreText = screen.getByText('80%');
    expect(scoreText.style.color).toBe('rgb(34, 197, 94)');
  });

  it('uses amber color for score 50-79', () => {
    render(<ProfileCompleteness score={60} />);
    const scoreText = screen.getByText('60%');
    expect(scoreText.style.color).toBe('rgb(245, 158, 11)');
  });

  it('uses red color for score < 50', () => {
    render(<ProfileCompleteness score={20} />);
    const scoreText = screen.getByText('20%');
    expect(scoreText.style.color).toBe('rgb(239, 68, 68)');
  });
});
