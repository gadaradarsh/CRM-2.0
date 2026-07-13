import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: { bg: '#f0fdf4', border: '#a7f3d0', color: '#065f46', icon: '✓', iconBg: '#d1fae5', iconColor: '#059669' },
  error:   { bg: '#fff1f2', border: '#fecdd3', color: '#881337', icon: '✕', iconBg: '#ffe4e6', iconColor: '#e11d48' },
  warning: { bg: '#fffbeb', border: '#fde68a', color: '#78350f', icon: '!', iconBg: '#fef3c7', iconColor: '#d97706' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', icon: 'i', iconBg: '#dbeafe', iconColor: '#2563eb' },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = id => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
        {toasts.map(t => {
          const s = TOAST_STYLES[t.type] || TOAST_STYLES.info;
          return (
            <div key={t.id}
              className="flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-lg pointer-events-auto"
              style={{
                background: s.bg,
                border: `1.5px solid ${s.border}`,
                color: s.color,
                animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
              }}>
              {/* Icon */}
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                style={{ background: s.iconBg, color: s.iconColor }}>
                {s.icon}
              </span>
              {/* Message */}
              <p className="flex-1 text-sm font-semibold leading-relaxed">{t.message}</p>
              {/* Close */}
              <button onClick={() => removeToast(t.id)}
                className="flex-shrink-0 mt-0.5 opacity-40 hover:opacity-80 transition-opacity text-sm font-bold"
                style={{ color: s.color }}>
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
export default ToastContext;
