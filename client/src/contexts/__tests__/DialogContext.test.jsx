import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DialogProvider, useDialog } from '../DialogContext';

const TestComponent = () => {
  const { showAlert, showConfirm } = useDialog();

  return (
    <div>
      <button onClick={() => showAlert('Test alert', 'info')}>Show Alert</button>
      <button onClick={() => showConfirm('Test confirm')}>Show Confirm</button>
    </div>
  );
};

describe('DialogContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when used outside provider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useDialog must be used within a DialogProvider');
    
    errorSpy.mockRestore();
  });

  it('should show alert modal', async () => {
    const user = userEvent.setup();
    render(
      <DialogProvider>
        <TestComponent />
      </DialogProvider>
    );

    const showAlertButton = screen.getByText('Show Alert');
    await user.click(showAlertButton);

    await waitFor(() => {
      expect(screen.getByText('Test alert')).toBeInTheDocument();
      expect(screen.getByText('Information')).toBeInTheDocument();
    });
  });

  it('should show confirm modal', async () => {
    const user = userEvent.setup();
    render(
      <DialogProvider>
        <TestComponent />
      </DialogProvider>
    );

    const showConfirmButton = screen.getByText('Show Confirm');
    await user.click(showConfirmButton);

    await waitFor(() => {
      expect(screen.getByText('Test confirm')).toBeInTheDocument();
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });
  });

  it('should resolve alert promise when closed', async () => {
    const user = userEvent.setup();
    let resolved = false;

    const TestComponentWithCallback = () => {
      const { showAlert } = useDialog();

      const handleShowAlert = async () => {
        await showAlert('Test', 'info');
        resolved = true;
      };

      return <button onClick={handleShowAlert}>Show Alert</button>;
    };

    render(
      <DialogProvider>
        <TestComponentWithCallback />
      </DialogProvider>
    );

    await user.click(screen.getByText('Show Alert'));

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    const okButton = screen.getByRole('button', { name: /close alert/i });
    await user.click(okButton);

    await waitFor(() => {
      expect(resolved).toBe(true);
    });
  });

  it('should resolve confirm promise with true when confirmed', async () => {
    const user = userEvent.setup();
    let confirmResult = null;

    const TestComponentWithCallback = () => {
      const { showConfirm } = useDialog();

      const handleShowConfirm = async () => {
        confirmResult = await showConfirm('Test');
      };

      return <button onClick={handleShowConfirm}>Show Confirm</button>;
    };

    render(
      <DialogProvider>
        <TestComponentWithCallback />
      </DialogProvider>
    );

    await user.click(screen.getByText('Show Confirm'));

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /^confirm action$/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(confirmResult).toBe(true);
    }, { timeout: 3000 });
  });

  it('should resolve confirm promise with false when cancelled', async () => {
    const user = userEvent.setup();
    let confirmResult = null;

    const TestComponentWithCallback = () => {
      const { showConfirm } = useDialog();

      const handleShowConfirm = async () => {
        confirmResult = await showConfirm('Test');
      };

      return <button onClick={handleShowConfirm}>Show Confirm</button>;
    };

    render(
      <DialogProvider>
        <TestComponentWithCallback />
      </DialogProvider>
    );

    await user.click(screen.getByText('Show Confirm'));

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(confirmResult).toBe(false);
    });
  });
});
