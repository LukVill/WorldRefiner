import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={20} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>{title}</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{message}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={onCancel}
                className="px-3 py-1.5 rounded text-sm transition-opacity hover:opacity-70"
                style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-3 py-1.5 rounded text-sm transition-opacity hover:opacity-80"
                style={{ background: 'var(--color-accent)', color: 'var(--color-accent-foreground)' }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
