"use client";

import { useNotifications } from '@/components/providers/NotificationProvider';

// Convenience hook for common notification patterns
export function useNotificationActions() {
  const { addNotification } = useNotifications();

  const showSuccess = (title: string, message?: string) => {
    addNotification({
      type: 'success',
      title,
      message,
    });
  };

  const showError = (title: string, message?: string) => {
    addNotification({
      type: 'error',
      title,
      message,
    });
  };

  const showWarning = (title: string, message?: string) => {
    addNotification({
      type: 'warning',
      title,
      message,
    });
  };

  const showInfo = (title: string, message?: string) => {
    addNotification({
      type: 'info',
      title,
      message,
    });
  };

  // API error handler
  const handleApiError = (error: any) => {
    let title = 'Error';
    let message = 'Ha ocurrido un error inesperado';

    if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      message = error.message;
    }

    showError(title, message);
  };

  // Form validation error
  const showValidationError = (field: string, message: string) => {
    showError('Error de validación', `${field}: ${message}`);
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    handleApiError,
    showValidationError,
  };
}
