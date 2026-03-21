import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Spinner from '../../components/common/Spinner';

// The Spinner renders: container > wrapper-div > inner-div(spin)
// container.firstChild = wrapper div (flex items-center justify-center)
// container.firstChild.firstChild = inner spinning div

describe('Spinner component', () => {
  it('renders without crashing', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toBeTruthy();
  });

  it('applies medium size class by default', () => {
    const { container } = render(<Spinner />);
    const inner = container.firstChild.firstChild;
    expect(inner.className).toContain('w-8');
    expect(inner.className).toContain('h-8');
  });

  it('applies small size class when size="sm"', () => {
    const { container } = render(<Spinner size="sm" />);
    const inner = container.firstChild.firstChild;
    expect(inner.className).toContain('w-4');
    expect(inner.className).toContain('h-4');
  });

  it('applies large size class when size="lg"', () => {
    const { container } = render(<Spinner size="lg" />);
    const inner = container.firstChild.firstChild;
    expect(inner.className).toContain('w-12');
    expect(inner.className).toContain('h-12');
  });

  it('applies custom className to wrapper div', () => {
    const { container } = render(<Spinner className="my-custom-class" />);
    expect(container.firstChild.className).toContain('my-custom-class');
  });

  it('has animate-spin class on inner div', () => {
    const { container } = render(<Spinner />);
    const inner = container.firstChild.firstChild;
    expect(inner.className).toContain('animate-spin');
  });

  it('has border and rounded classes for ring appearance', () => {
    const { container } = render(<Spinner />);
    const inner = container.firstChild.firstChild;
    expect(inner.className).toContain('rounded-full');
    expect(inner.className).toContain('border-2');
  });

  it('wrapper has flex and justify-center classes', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild.className).toContain('flex');
    expect(container.firstChild.className).toContain('justify-center');
  });
});
