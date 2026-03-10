import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CameraPermissionModal from '../index';
import { AuthProvider } from '../../../contexts/AuthContext';
import { DialogProvider } from '../../../contexts/DialogContext';

const mockUseFacialAnalysis = vi.fn();

vi.mock('../../../contexts/FacialAnalysisContext', async () => {
  const actual = await vi.importActual('../../../contexts/FacialAnalysisContext');
  return {
    ...actual,
    useFacialAnalysis: () => mockUseFacialAnalysis(),
  };
});

const wrapper = ({ children }) => (
  <AuthProvider>
    <DialogProvider>{children}</DialogProvider>
  </AuthProvider>
);

describe('CameraPermissionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
    mockUseFacialAnalysis.mockReturnValue({
      showPermissionModal: false,
      handleAllowCamera: vi.fn(),
      handleDenyCamera: vi.fn(),
    });
  });

  it('should not render when not shown', () => {
    const { container } = render(<CameraPermissionModal />, { wrapper });

    expect(container.firstChild).toBeNull();
  });

  it('should render when permission modal is shown', () => {
    mockUseFacialAnalysis.mockReturnValue({
      showPermissionModal: true,
      handleAllowCamera: vi.fn(),
      handleDenyCamera: vi.fn(),
    });

    render(<CameraPermissionModal />, { wrapper });

    expect(screen.getByText(/enable wellness monitoring/i)).toBeInTheDocument();
  });

  it('should call handleAllowCamera when allow button is clicked', async () => {
    const mockHandleAllow = vi.fn();
    mockUseFacialAnalysis.mockReturnValue({
      showPermissionModal: true,
      handleAllowCamera: mockHandleAllow,
      handleDenyCamera: vi.fn(),
    });

    const user = userEvent.setup();
    render(<CameraPermissionModal />, { wrapper });

    const buttons = screen.getAllByRole('button');
    const allowButton = buttons.find(btn => btn.textContent.toLowerCase().includes('allow camera'));
    expect(allowButton).toBeDefined();
    await user.click(allowButton);

    expect(mockHandleAllow).toHaveBeenCalled();
  });
});
