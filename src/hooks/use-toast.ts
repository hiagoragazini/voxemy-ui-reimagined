
// Re-export from the UI component
import { useToast, toast } from "@/components/ui/use-toast";

export { useToast, toast };

// Also export the ToastProvider for use in the main.tsx
import { ToastProvider } from "@/components/ui/toast";
export { ToastProvider };
