import { createContext, useContext, useState, useCallback } from 'react';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [alert, setAlert] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const showAlert = useCallback((message, type = 'info') => {
    return new Promise((resolve) => {
      setAlert({
        message,
        type,
        onClose: () => {
          setAlert(null);
          resolve();
        }
      });
    });
  });

  const showConfirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setConfirm({
        message,
        title: options.title || 'Confirm Action',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'warning',
        onConfirm: () => {
          setConfirm(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirm(null);
          resolve(false);
        }
      });
    });
  });

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {alert && (
        <AlertModal
          message={alert.message}
          type={alert.type}
          onClose={alert.onClose}
        />
      )}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          title={confirm.title}
          confirmText={confirm.confirmText}
          cancelText={confirm.cancelText}
          type={confirm.type}
          onConfirm={confirm.onConfirm}
          onCancel={confirm.onCancel}
        />
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
