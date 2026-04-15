import React, { createContext, useContext, useState, useCallback } from 'react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

type ModalVariant = 'danger' | 'info' | 'success' | 'warning';

interface ModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ModalVariant;
  onConfirm?: () => void;
  onCancel?: () => void;
  hideCancel?: boolean;
}

interface ModalContextType {
  showAlert: (title: string, message: string, variant?: ModalVariant) => Promise<void>;
  showConfirm: (title: string, message: string, options?: Partial<ModalOptions>) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalOptions & { isOpen: boolean }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    hideCancel: false
  });

  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const showAlert = useCallback((title: string, message: string, variant: ModalVariant = 'info') => {
    return new Promise<void>((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        variant,
        confirmText: 'OK',
        hideCancel: true,
        onConfirm: () => {
          resolve();
        }
      });
    });
  }, []);

  const showConfirm = useCallback((title: string, message: string, options: Partial<ModalOptions> = {}) => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        variant: options.variant || 'danger',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        hideCancel: false,
        onConfirm: () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        }
      });
      setResolver(() => resolve);
    });
  }, []);

  const handleClose = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    if (resolver) {
      resolver(false);
      setResolver(null);
    }
  };

  const handleConfirm = () => {
    if (modalState.onConfirm) modalState.onConfirm();
    setModalState(prev => ({ ...prev, isOpen: false }));
    setResolver(null);
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        variant={modalState.variant}
        hideCancel={modalState.hideCancel}
      />
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
