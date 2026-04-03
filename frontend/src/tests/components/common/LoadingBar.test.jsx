import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../utils/renderWithProviders';
import LoadingBar from '../../../components/common/LoadingBar';

describe('LoadingBar', () => {
  it('renders nothing when loading is false', () => {
    const { container } = renderWithProviders(<LoadingBar />, {
      preloadedState: { ui: { loading: false } },
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders the animated bar when loading is true', () => {
    const { container } = renderWithProviders(<LoadingBar />, {
      preloadedState: { ui: { loading: true } },
    });
    expect(container.querySelector('.fixed.top-16')).toBeInTheDocument();
    expect(container.querySelector('.h-1')).toBeInTheDocument();
  });
});
