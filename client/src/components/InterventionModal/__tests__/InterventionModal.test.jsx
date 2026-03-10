import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InterventionModal from '../index';
import { AuthProvider } from '../../../contexts/AuthContext';
import { DialogProvider } from '../../../contexts/DialogContext';

const mockUseWellnessIntervention = vi.fn();

vi.mock('../../../contexts/WellnessInterventionContext', async () => {
  const actual = await vi.importActual('../../../contexts/WellnessInterventionContext');
  return {
    ...actual,
    useWellnessIntervention: () => mockUseWellnessIntervention(),
  };
});

vi.mock('../BreathingExercise', () => ({
  default: ({ onClose }) => (
    <div>
      <h2>Breathing Exercise</h2>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('../MindfulnessExercise', () => ({
  default: ({ onClose }) => (
    <div>
      <h2>Mindfulness Exercise</h2>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

const wrapper = ({ children }) => (
  <AuthProvider>
    <DialogProvider>{children}</DialogProvider>
  </AuthProvider>
);

describe('InterventionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
    mockUseWellnessIntervention.mockReturnValue({
      activeIntervention: null,
      closeIntervention: vi.fn(),
    });
  });

  it('should not render when no active intervention', () => {
    const { container } = render(<InterventionModal />, { wrapper });

    expect(container.firstChild).toBeNull();
  });

  it('should render breathing exercise', () => {
    mockUseWellnessIntervention.mockReturnValue({
      activeIntervention: { type: 'breathing', reason: 'Test' },
      closeIntervention: vi.fn(),
    });

    render(<InterventionModal />, { wrapper });

    expect(screen.getAllByText('Breathing Exercise').length).toBeGreaterThan(0);
  });

  it('should close on Escape key', async () => {
    const mockClose = vi.fn();
    mockUseWellnessIntervention.mockReturnValue({
      activeIntervention: { type: 'breathing', reason: 'Test' },
      closeIntervention: mockClose,
    });

    const user = userEvent.setup();
    render(<InterventionModal />, { wrapper });

    await user.keyboard('{Escape}');

    expect(mockClose).toHaveBeenCalled();
  });
});
