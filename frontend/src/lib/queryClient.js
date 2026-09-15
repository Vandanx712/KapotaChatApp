import { QueryClient, onlineManager } from "@tanstack/react-query";

// Connect TanStack Query's onlineManager to browser's native network events
onlineManager.setEventListener((setOnline) => {
  const onOnline = () => setOnline(true);
  const onOffline = () => setOnline(false);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes default for profiles, explore feeds, metadata
      gcTime: 1000 * 60 * 30, // 30 minutes in garbage collection
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Do not retry on 401/403/404
        if (error?.response?.status && [401, 403, 404].includes(error.response.status)) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
