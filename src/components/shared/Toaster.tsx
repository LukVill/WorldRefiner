import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export function Toaster() {
  const toasts = useUIStore(s => s.toasts);
  const removeToast = useUIStore(s => s.removeToast);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg pointer-events-auto max-w-xs"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          >
            {toast.type === 'success' && <CheckCircle size={16} style={{ color: 'var(--color-location)' }} />}
            {toast.type === 'error' && <XCircle size={16} style={{ color: 'var(--color-accent)' }} />}
            {toast.type === 'info' && <Info size={16} style={{ color: 'var(--color-primary)' }} />}
            <span className="text-sm flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="hover:opacity-70 ml-1">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
