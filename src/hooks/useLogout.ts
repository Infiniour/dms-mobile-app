import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { clearTokens, logout as logoutRequest } from '@/services';
import { useAuthStore } from '@/store';

export function useLogout() {
  const router = useRouter();
  const resetAuthState = useAuthStore((s) => s.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logoutRequest();
    } catch (error) {
      // Local logout must still complete if the server/session is already unavailable.
      if (__DEV__) {
        console.log('Logout API failed; clearing local session anyway.', error);
      }
    }

    await clearTokens();
    resetAuthState();
    setIsLoggingOut(false);
    // Land on Get Started (auth index), not the phone screen — replace so
    // setup/app history is cleared and Android back can't re-enter a logged-out session.
    router.replace('/(auth)');
  }, [isLoggingOut, resetAuthState, router]);

  return {
    isLoggingOut,
    logout,
  };
}
