import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CustomAlert } from './CustomAlert';
import { CustomNotification } from './CustomNotification';
import { Toast } from './Toast';

interface AlertButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface NotificationButton {
  text: string;
  onPress: () => void;
}

interface NotificationContextType {
  showAlert: (title: string, message: string, buttons: AlertButton[]) => void;
  showNotification: (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info', actionButton?: NotificationButton) => void;
  showToast: (message: string, type: 'success' | 'warning' | 'error' | 'info', duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [alertVisible, setAlertVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<AlertButton[]>([]);
  
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'warning' | 'error' | 'info'>('info');
  const [notificationActionButton, setNotificationActionButton] = useState<NotificationButton | undefined>();
  
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning' | 'error' | 'info'>('info');
  const [toastDuration, setToastDuration] = useState(3000);

  const showAlert = (title: string, message: string, buttons: AlertButton[]) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertButtons(buttons);
    setAlertVisible(true);
  };

  const showNotification = (
    title: string, 
    message: string, 
    type: 'success' | 'warning' | 'error' | 'info', 
    actionButton?: NotificationButton
  ) => {
    setNotificationTitle(title);
    setNotificationMessage(message);
    setNotificationType(type);
    setNotificationActionButton(actionButton);
    setNotificationVisible(true);
  };

  const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info', duration?: number) => {
    setToastMessage(message);
    setToastType(type);
    setToastDuration(duration || 3000);
    setToastVisible(true);
  };

  const closeAlert = () => setAlertVisible(false);
  const closeNotification = () => setNotificationVisible(false);
  const closeToast = () => setToastVisible(false);

  return (
    <NotificationContext.Provider value={{ showAlert, showNotification, showToast }}>
      {children}
      
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onClose={closeAlert}
      />
      
      <CustomNotification
        visible={notificationVisible}
        title={notificationTitle}
        message={notificationMessage}
        type={notificationType}
        onClose={closeNotification}
        actionButton={notificationActionButton}
      />
      
      <Toast
        message={toastMessage}
        type={toastType}
        duration={toastDuration}
        visible={toastVisible}
        onHide={closeToast}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
