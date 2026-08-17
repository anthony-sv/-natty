import { useQuery } from "@tanstack/react-query";
import { fetchHandle } from "@/server/handles";

/**
 * The signed-in user's own handle.
 *
 * `useQuery` rather than the app's usual "read once on mount" `useState`
 * shape: unlike `Date.now()` or a lazily-loaded static list, *which* user
 * this is for changes while the app runs — sign out, sign in as someone
 * else — and a one-shot fetch captured at first mount would keep showing the
 * previous account's handle. Keying on `userId` (`enabled: false` while it's
 * `null`, i.e. signed out or still loading) makes a user change refetch
 * automatically, and lets `UserMenu`'s header and sidebar instances share
 * one request instead of firing two.
 *
 * `undefined` while unresolved, `null` once settled with nothing claimed.
 */
export function useOwnHandle(userId: string | null): string | null | undefined {
  const { data } = useQuery({
    queryKey: ["handle", userId],
    queryFn: () => fetchHandle(),
    enabled: userId !== null,
    staleTime: Infinity,
  });
  return data;
}
