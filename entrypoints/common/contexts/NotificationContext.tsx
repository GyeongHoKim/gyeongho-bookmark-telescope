import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from 'react';
import type { NotificationType } from '../components/Notification';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationState {
  notifications: NotificationData[];
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: NotificationData }
  | { type: 'REMOVE_NOTIFICATION'; payload: { id: string } }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' };

interface NotificationOptions {
  variant: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: NotificationData[];
  notify: (options: NotificationOptions) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const initialState: NotificationState = {
  notifications: [],
};

function notificationReducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload.id
        ),
      };
    case 'CLEAR_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };
    default:
      return state;
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const notify = useCallback((options: NotificationOptions) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id,
        type: options.variant,
        title: options.title,
        message: options.message,
        duration: options.duration,
      },
    });
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({
      type: 'REMOVE_NOTIFICATION',
      payload: { id },
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
  }, []);

  const value = {
    notifications: state.notifications,
    notify,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
}
