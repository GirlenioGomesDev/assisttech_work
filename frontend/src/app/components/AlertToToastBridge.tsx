// Troca alert() antigo por toast visual sem mudar chamadas existentes.
import { useEffect } from 'react';
import { toast } from 'sonner';

const isErrorMessage = (message: string) => (
  /\berro\b|\binvalido\b|\binvalidos\b|\bfalha\b|\bnao\b|\bnão\b|\bremover\b|\bapagar\b/i.test(message)
);

export function AlertToToastBridge() {
  useEffect(() => {
    const originalAlert = window.alert;

    window.alert = (message?: any) => {
      const text = String(message ?? '');
      if (!text.trim()) return;

      if (isErrorMessage(text)) {
        toast.error(text);
      } else {
        toast.success(text);
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  return null;
}
