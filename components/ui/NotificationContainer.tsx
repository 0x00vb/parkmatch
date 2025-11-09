"use client";

import { useNotifications } from '@/components/providers/NotificationProvider';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const iconMap = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

const colorMap = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColorMap = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
};

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => {
        const Icon = iconMap[notification.type];

        return (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border shadow-lg transform transition-all duration-300 ease-in-out ${colorMap[notification.type]}`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Icon className={`h-6 w-6 ${iconColorMap[notification.type]}`} />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium">
                  {notification.title}
                </h3>
                {notification.message && (
                  <p className="mt-1 text-sm opacity-90">
                    {notification.message}
                  </p>
                )}
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="inline-flex text-current hover:opacity-75 transition-opacity"
                  onClick={() => removeNotification(notification.id)}
                >
                  <span className="sr-only">Cerrar</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
