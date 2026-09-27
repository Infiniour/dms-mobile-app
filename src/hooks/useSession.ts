import { useEffect, useState } from 'react';
import { getTokens, peekTokens, subscribeTokens } from '@/services';
import { useAuthStore } from '@/store';

type SessionState = {
  isLoading: boolean;
  hasTokens: boolean;
};

function syncAuthStore(hasTokens: boolean) {
  const { setIsLoggedIn, setCanEnterApp } = useAuthStore.getState();

  setIsLoggedIn(hasTokens);

  if (!hasTokens) {
    setCanEnterApp(false);
  }
}

function readSession(): SessionState {
  const tokens = peekTokens();

  // `undefined` means the keychain has not been read yet this launch.
  if (tokens === undefined) {
    return { isLoading: true, hasTokens: false };
  }

  return { isLoading: false, hasTokens: Boolean(tokens) };
}

/**
 * Session guard shared by every route group layout.
 *
 * The keychain is read at most once per launch: the first layout to mount pays
 * for it, and every layout mounted afterwards resolves synchronously on its
 * first render. Without this, each group transition mounted a fresh layout that
 * flashed a full-screen spinner while it re-read SecureStore before redirecting.
 */
export function useSession(): SessionState {
  const [session, setSession] = useState<SessionState>(readSession);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = subscribeTokens((tokens: unknown) => {
      if (!cancelled) {
        setSession({ isLoading: false, hasTokens: Boolean(tokens) });
      }
    });

    if (session.isLoading) {
      getTokens().then((tokens) => {
        if (cancelled) {
          return;
        }

        const hasTokens = Boolean(tokens);
        setSession({ isLoading: false, hasTokens });
        syncAuthStore(hasTokens);
      });
    } else {
      syncAuthStore(session.hasTokens);
    }

    return () => {
      cancelled = true;
      unsubscribe();
    };
    // Runs once per mount; token changes arrive through the subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return session;
}
