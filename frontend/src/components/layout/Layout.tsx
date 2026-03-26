import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  return (
    <div className="flex" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <Sidebar />
      <div className="flex flex-col" style={{ flex: 1, marginLeft: '250px' }}>
        <Header />
        <main style={{ padding: '2rem', marginTop: '64px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
