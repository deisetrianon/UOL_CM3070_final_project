import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../index';
import { AuthProvider } from '../../../contexts/AuthContext';
import { NotificationProvider } from '../../../contexts/NotificationContext';
import { FacialAnalysisProvider } from '../../../contexts/FacialAnalysisContext';
import { KeystrokeProvider } from '../../../contexts/KeystrokeContext';
import { StressFusionProvider } from '../../../contexts/StressFusionContext';
import { ZenModeProvider } from '../../../contexts/ZenModeContext';
import { WellnessInterventionProvider } from '../../../contexts/WellnessInterventionContext';

const wrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <FacialAnalysisProvider>
        <KeystrokeProvider>
          <StressFusionProvider>
            <ZenModeProvider>
              <NotificationProvider>
                <WellnessInterventionProvider>
                  {children}
                </WellnessInterventionProvider>
              </NotificationProvider>
            </ZenModeProvider>
          </StressFusionProvider>
        </KeystrokeProvider>
      </FacialAnalysisProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Layout', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    
    global.fetch = vi.fn((url) => {
      if (url === '/api/settings') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            settings: {
              notifications: { email: true, stressAlerts: true },
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: false, isAuthenticated: false }),
      });
    });
  });

  it('should render layout with all components', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>,
      { wrapper }
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should have skip link for accessibility', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>,
      { wrapper }
    );

    const skipLink = screen.getByText(/skip to main content/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('should have aria-live region', () => {
    const { container } = render(
      <Layout>
        <div>Content</div>
      </Layout>,
      { wrapper }
    );

    const appLayout = container.querySelector('.app-layout');
    expect(appLayout).not.toBeNull();
    
    const liveRegion = appLayout?.querySelector('#aria-live-region') || 
                      container.querySelector('#aria-live-region') ||
                      document.getElementById('aria-live-region');
    
    expect(liveRegion).not.toBeNull();
    expect(liveRegion).toBeInstanceOf(HTMLElement);
    expect(liveRegion).toHaveAttribute('id', 'aria-live-region');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('should handle window resize', () => {
    const { rerender } = render(
      <Layout>
        <div>Content</div>
      </Layout>,
      { wrapper }
    );

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    window.dispatchEvent(new Event('resize'));

    rerender(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
