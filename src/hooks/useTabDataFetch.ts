import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export type TabFetchContext = {
  /** True after the screen blurs or dependencies change and this fetch is obsolete. */
  isCancelled: () => boolean;
};

type FetchFunction = (ctx: TabFetchContext) => Promise<void>;

type UseTabDataFetchOptions = {
  onFocus: FetchFunction;
  dependencies?: React.DependencyList;
};

/**
 * Refetches tab data on focus. Callers must gate `setState` with
 * `ctx.isCancelled()` so a slow response cannot overwrite newer data after
 * blur or when dependencies (e.g. dashboard range) change mid-flight.
 */
export function useTabDataFetch({ onFocus, dependencies = [] }: UseTabDataFetchOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const isCancelled = () => cancelled;

      async function load() {
        setIsLoading(true);
        try {
          await onFocusRef.current({ isCancelled });
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      }

      load();

      return () => {
        cancelled = true;
      };
      // onFocus is read via ref so callers can pass an inline function without
      // stale-closure bugs; only `dependencies` should re-trigger the fetch.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies)
  );

  return { isLoading, setIsLoading };
}
