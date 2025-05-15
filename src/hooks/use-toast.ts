
// Implementação do hook para toast
import { useToast as useToastInternal } from "@/components/ui/use-toast";

export const useToast = useToastInternal;

// Re-export do toast
import { toast as toastInternal } from "@/components/ui/toast";
export const toast = toastInternal;
