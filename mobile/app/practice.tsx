import { useEffect } from 'react';
import { router } from 'expo-router';
import { LoadingScreen } from '@/components/loading-screen';

export default function PracticeScreen() {
  useEffect(() => {
    router.replace('/quick-practice');
  }, []);

  return <LoadingScreen label="Открываем быструю практику..." />;
}
