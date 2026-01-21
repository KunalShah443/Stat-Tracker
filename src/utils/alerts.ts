import { Alert, Platform } from 'react-native';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
};

function formatMessage(title: string, message: string) {
  return `${title}\n\n${message}`;
}

function canUseWebDialog(method: 'alert' | 'confirm') {
  return (
    Platform.OS === 'web' &&
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as { [key: string]: unknown })[method] === 'function'
  );
}

export function showAlert(title: string, message: string) {
  if (canUseWebDialog('alert')) {
    (globalThis as { alert: (text: string) => void }).alert(
      formatMessage(title, message)
    );
    return;
  }

  Alert.alert(title, message);
}

export function showConfirm({
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
}: ConfirmOptions) {
  if (canUseWebDialog('confirm')) {
    const ok = (globalThis as { confirm: (text: string) => boolean }).confirm(
      formatMessage(title, message)
    );
    if (ok) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}
