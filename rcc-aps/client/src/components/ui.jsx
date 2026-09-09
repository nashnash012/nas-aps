import { useEffect, useRef, useState } from 'react';

export function useToast() {
  const [msg, setMsg] = useState('');
  const [icon, setIcon] = useState('✅');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = (m, ic = '✅') => {
    setIcon(ic);
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 2600);
  };
  const node = (
    <div className={'toast' + (msg ? ' show' : '')}>
      <span>{icon}</span>
      <span>{msg}</span>
    </div>
  );
  return [node, show];
}

export default function Modal({ open, title, onClose, children, footer, width, maxWidth }) {
  if (!open) return null;
  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div
        className={'modal' + (width === 'wide' ? ' modal-wide' : '')}
        style={maxWidth ? { maxWidth } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function BackLink({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--maroon-dark)', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
      ← {children}
    </button>
  );
}

export function EmptyState({ icon, title, sub, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div>{sub}</div>
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}