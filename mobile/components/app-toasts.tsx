import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Top-offset toasts so banners stay clear of the status bar and primary actions at the bottom. */
export function AppToasts() {
  const insets = useSafeAreaInsets();

  return (
    <Toast
      position="top"
      topOffset={insets.top + 8}
      bottomOffset={insets.bottom + 88}
    />
  );
}
