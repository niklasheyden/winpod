import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { create } from 'zustand';

interface ToastState {
  message: string | null;
  showToast: (message: string) => void;
  hideToast: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  showToast: (message) => {
    set({ message });
    setTimeout(() => {
      set({ message: null });
    }, 3000);
  },
  hideToast: () => set({ message: null }),
}));

const Toast = () => {
  const { message, hideToast } = useToast();

  useEffect(() => {
    if (message) {
      const timer = setTimeout(hideToast, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, hideToast]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-kit-green text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <span>{message}</span>
        <button onClick={hideToast} className="text-white hover:text-gray-200">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;