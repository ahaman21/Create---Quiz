import { Notification } from '../types/types';

type NotificationCallback = (notification: Notification) => void;
let notificationCallback: NotificationCallback | null = null;

export const initializeNotification = (callback: NotificationCallback) => {
  notificationCallback = callback;
};

export const showNotification = (message: string, type: 'success' | 'error') => {
  if (notificationCallback) {
    notificationCallback({ message, type });
  }
};