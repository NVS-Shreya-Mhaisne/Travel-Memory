import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

let idCounter = 1;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const showToast = useCallback((message, type = 'info', duration = 4500) => {
    const id = idCounter++;
    const toast = { id, message, type, duration };
    setToasts((t) => [...t, toast]);

    if (duration > 0) {
      const timeout = setTimeout(() => {
        setToasts((t) => t.filter(x => x.id !== id));
        timers.current.delete(id);
      }, duration);
      timers.current.set(id, timeout);
    }
    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts((t) => t.filter(x => x.id !== id));
    const to = timers.current.get(id);
    if (to) {
      clearTimeout(to);
      timers.current.delete(id);
    }
  }, []);

  useEffect(() => {
    return () => {
      // cleanup timers
      timers.current.forEach((to) => clearTimeout(to));
      timers.current.clear();
    };
  }, []);

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  const bgClasses = {
    success: 'from-emerald-500 to-emerald-600',
    error: 'from-rose-500 to-rose-600',
    info: 'from-sky-500 to-teal-600'
  };

  const styleSheet = `
  @keyframes toastSlideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes toastProgress { from { width: 100%; } to { width: 0%; } }
  `;

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <style>{styleSheet}</style>
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-[calc(100%-32px)] w-[360px]">
        {toasts.map(toast => (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className="w-full bg-gray-900/95 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-4 text-white flex gap-4 items-center overflow-hidden"
            style={{
              animation: 'toastSlideIn 400ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Type Indicator Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg ${bgClasses[toast.type] || bgClasses.info}`}>
              <i className={`fas ${icons[toast.type] || icons.info} text-xl`}></i>
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <p className="font-bold text-sm tracking-wide mb-1 capitalize text-gray-100">{toast.type}</p>
              <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">{toast.message}</p>

              {/* Progress Tracker */}
              <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${bgClasses[toast.type] || bgClasses.info} opacity-80`}
                  style={{
                    width: '100%',
                    transformOrigin: 'left',
                    animation: `toastProgress ${toast.duration}ms linear forwards`
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => hideToast(toast.id)}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
            >
              <i className="fas fa-times text-[10px]"></i>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
