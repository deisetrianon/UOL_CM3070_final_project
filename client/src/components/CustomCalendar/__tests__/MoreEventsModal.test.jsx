import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MoreEventsModal from '../MoreEventsModal';
import moment from 'moment';

describe('MoreEventsModal', () => {
  const mockEvents = [
    {
      id: 'event1',
      title: 'Meeting 1',
      start: '2024-01-15T10:00:00Z',
      end: '2024-01-15T11:00:00Z',
    },
    {
      id: 'event2',
      title: 'Meeting 2',
      start: '2024-01-15T14:00:00Z',
      end: '2024-01-15T15:00:00Z',
    },
  ];

  const mockProps = {
    events: mockEvents,
    selectedDay: moment('2024-01-15'),
    onEventClick: vi.fn(),
    onClose: vi.fn(),
    getEventColorStyle: vi.fn(() => ({ backgroundColor: '#blue' })),
  };

  it('should render modal with events', () => {
    render(<MoreEventsModal {...mockProps} />);

    expect(screen.getByText(/events for/i)).toBeInTheDocument();
    expect(screen.getByText('Meeting 1')).toBeInTheDocument();
    expect(screen.getByText('Meeting 2')).toBeInTheDocument();
  });

  it('should call onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    render(<MoreEventsModal {...mockProps} />);

    const overlay = screen.getByText(/events for/i).closest('.more-events-modal-overlay');
    await user.click(overlay);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should call onEventClick when event is clicked', async () => {
    const user = userEvent.setup();
    render(<MoreEventsModal {...mockProps} />);

    const event = screen.getByText('Meeting 1').closest('.more-events-item');
    await user.click(event);

    expect(mockProps.onEventClick).toHaveBeenCalledWith(mockEvents[0]);
    expect(mockProps.onClose).toHaveBeenCalled();
  });
});
