
// Custom toast hook implementation
import * as React from "react";

export type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
  action?: React.ReactNode;
};

type ToastContextType = {
  toast: (props: ToastProps) => void;
  toasts: (ToastProps & { id: string })[];
};

const ToastContext = React.createContext<ToastContextType>({
  toast: () => {}, // Default no-op implementation
  toasts: [],
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: string })[]>([]);

  const toast = React.useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...props, id }]);
    
    // Auto-dismiss after the specified duration or default 5000ms
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, props.duration || 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, toasts }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`p-4 rounded-md shadow-md max-w-md animate-in slide-in-from-bottom-5 ${
              t.variant === "destructive" ? "bg-red-100 border-red-200 text-red-800" : "bg-white"
            }`}
          >
            {t.title && <h3 className="font-medium mb-1">{t.title}</h3>}
            {t.description && <p className="text-sm">{t.description}</p>}
            {t.action}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Standalone toast function for use outside of components
export const toast = (props: ToastProps) => {
  // This is a simple implementation that just logs to console outside React components
  console.log(`Toast: ${props.title} - ${props.description}`);
};
