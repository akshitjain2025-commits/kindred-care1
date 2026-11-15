import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HealthVitalsStudio from '../HealthVitalsStudio';

vi.mock('../freebuffAuth', () => ({
  useFreebuffAuth: () => ({
    isAuthenticated: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    session: {user: null},
  }),
}));

describe('HealthVitalsStudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the vitals tracking interface', () => {
    render(<HealthVitalsStudio residentId="test-resident" />);

    // Should have vitals form or display
    const vitalsSection = screen.getByText(/blood pressure/i) || screen.getByTestId('vitals-section');
    expect(vitalsSection).toBeInTheDocument();
  });

  it('has mood check-in controls', () => {
    render(<HealthVitalsStudio residentId="test-resident" />);

    const moodInput = screen.getByRole('combobox') || screen.getByText(/mood/i);
    expect(moodInput).toBeInTheDocument();
  });

  it('has safety score display', () => {
    render(<HealthVitalsStudio residentId="test-resident" />);

    const safetyScore = screen.getByText(/safety score/i) || screen.getByTestId('safety-score');
    expect(safetyScore).toBeInTheDocument();
  });
});