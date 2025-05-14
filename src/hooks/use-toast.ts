
import * as React from "react";

export type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
  action?: React.ReactNode;
  id?: string;
};

type ToastContextType = {
  toast: (props: ToastProps) => void;
  toasts: (ToastProps & { id: string })[];
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

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

  // When using JSX in a .ts file, TypeScript will throw errors
  // Instead of using JSX, we'll use React.createElement
  return React.createElement(
    ToastContext.Provider,
    { value: { toast, toasts } },
    children
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Standalone toast function for use outside of components
export function toast(props: ToastProps) {
  // This is a simple implementation that just logs to console outside React components
  console.log(`Toast: ${props.title} - ${props.description}`);
}
