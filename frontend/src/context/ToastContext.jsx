import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Floating Toast Notification Center */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          let Icon = Info;
          let bgColor = "bg-slate-900 border-slate-800 text-white";
          
          if (t.type === "success") {
            Icon = CheckCircle;
            bgColor = "bg-white border-emerald-200 text-slate-800 shadow-lg";
          } else if (t.type === "error") {
            Icon = AlertCircle;
            bgColor = "bg-white border-rose-200 text-slate-800 shadow-lg";
          } else if (t.type === "warning") {
            Icon = AlertTriangle;
            bgColor = "bg-white border-amber-200 text-slate-800 shadow-lg";
          }

          const iconColors = {
            success: "text-emerald-500",
            error: "text-rose-500",
            warning: "text-amber-500",
            info: "text-blue-500"
          };

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 border rounded-xl animate-slide-in transition-all duration-300 ${bgColor}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColors[t.type] || "text-slate-500"}`} />
              <div className="flex-1 text-xs font-bold leading-relaxed">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
