import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import StressHistory from '../index';

vi.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Area: () => null,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
}));

describe('StressHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        history: [],
        statistics: {
          totalEntries: 0,
          averageScore: 0,
          maxScore: 0,
          minScore: 0,
        },
      }),
    });
  });

  it('should render stress history component', async () => {
    render(<StressHistory timeRange={7} />);

    await waitFor(() => {
      expect(screen.queryByText(/loading stress history/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    const hasRegion = screen.queryByRole('region');
    const hasEmptyState = screen.queryByText(/no stress history available yet/i);
    expect(hasRegion || hasEmptyState).toBeTruthy();
  });

  it('should fetch history on mount', async () => {
    render(<StressHistory timeRange={7} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stress-logs?days=7'),
        expect.any(Object)
      );
    });
  });

  it('should display statistics', async () => {
    const mockHistory = [
      {
        timestamp: new Date().toISOString(),
        stressScore: 50,
        stressLevel: 'moderate',
        componentScores: { facialScore: 50, keystrokeScore: 50 },
      },
    ];

    global.fetch
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          history: mockHistory,
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          statistics: {
            totalEntries: 10,
            averageScore: 50,
            maxScore: 80,
            minScore: 20,
          },
        }),
      });

    render(<StressHistory timeRange={7} />);

    await waitFor(() => {
      expect(screen.getByText(/10/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
