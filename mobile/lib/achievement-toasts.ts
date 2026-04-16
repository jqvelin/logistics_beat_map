import Toast from 'react-native-toast-message';
import type { UnlockedAchievementPayload } from '@/lib/types';

/**
 * Shows achievement toasts at the top of the screen (see `AppToasts` in root layout)
 * so they do not cover tab bars or lesson CTAs at the bottom.
 */
export function showAchievementUnlockToasts(items: UnlockedAchievementPayload[]) {
  if (items.length === 0) {
    return;
  }

  items.forEach((item, index) => {
    setTimeout(() => {
      Toast.show({
        type: 'info',
        text1: `${item.emoji} ${item.title}`,
        text2: item.description,
        position: 'top',
        visibilityTime: 4500,
      });
    }, index * 550);
  });
}
