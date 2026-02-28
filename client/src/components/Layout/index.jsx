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
      <Navbar />
      <div className="layout-content">
        {isMobile && (
          <>
            <Sidebar />
            <WellnessPanel />
          </>
        )}
        {!isMobile && <Sidebar />}
        <main className="layout-main">
          {children}
        </main>
        {!isMobile && <WellnessPanel />}
      </div>
    </div>
  );
}

export default Layout;
