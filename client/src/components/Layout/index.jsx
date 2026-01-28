import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import './Layout.css';

function Layout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <div className="layout-content">
        <Sidebar />
        <main className="layout-main">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
