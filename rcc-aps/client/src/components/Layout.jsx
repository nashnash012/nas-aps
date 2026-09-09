import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);

  return (
    <div className={'dashboard-page show' + (open ? ' sb-open' : '')}>
      <Sidebar onNavigate={() => setOpen(false)} />
      <div id="sbBackdrop" className={open ? 'show' : ''} onClick={() => setOpen(false)} />
      <div className="dash-main">
        <Navbar onMenu={() => setOpen(true)} />
        <div className="dash-content">{children}</div>
      </div>
    </div>
  );
}