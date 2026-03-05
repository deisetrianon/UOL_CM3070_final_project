/**
 * Layout component.
 * Main application layout wrapper with navbar, sidebar, and wellness panel.
 * Handles responsive design for mobile and desktop views.
 * 
 * @module components/Layout
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {JSX.Element} Layout component
 */

import { useState, useEffect } from 'react';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import WellnessPanel from '../WellnessPanel';
import './Layout.css';

function Layout({ children }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <div className="layout-content">
        {isMobile && (
          <>
            <Sidebar />
            <WellnessPanel />
          </>
        )}
        {!isMobile && <Sidebar />}
        <main id="main-content" className="layout-main" role="main">
          {children}
        </main>
        {!isMobile && <WellnessPanel />}
      </div>
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="aria-live-region"></div>
    </div>
  );
}

export default Layout;
