import { useQuery } from "@tanstack/react-query";
import {
  contactDetail,
  getAvatars,
  getConversations,
  getOtherUsers,
  postFeed,
} from "../lib/axios";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";

export const QUERY_KEYS = {
  conversations: ["conversations"],
  otherUsers: (id) => ["otherUsers", id],
  userProfile: (id) => ["userProfile", id],
  exploreFeed: ["exploreFeed"],
  avatars: ["avatars"],
};

/**
 * Hook to query conversations with 5-minute cache.
 * Automatically synchronizes conversations with useChatStore for real-time WebSocket state.
 */
export function useConversationsQuery(options = {}) {
  const query = useQuery({
    queryKey: QUERY_KEYS.conversations,
    queryFn: async () => {
      const data = await getConversations();
      return data?.filtered || [];
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });

  // Sync to zustand store so real-time socket events mutate this state
  useEffect(() => {
    if (query.data && Array.isArray(query.data)) {
      const currentConversations = useChatStore.getState().conversations;
      // Only set if store is empty or if query just finished initially
      if (currentConversations.length === 0) {
        useChatStore.setState({ conversations: query.data });
      } else {
        // Merge or update without clobbering real-time updates
        useChatStore.setState((state) => {
          const map = new Map(state.conversations.map((c) => [c.conversationId, c]));
          query.data.forEach((c) => {
            if (!map.has(c.conversationId)) {
              map.set(c.conversationId, c);
            }
          });
          return { conversations: Array.from(map.values()) };
        });
      }
    }
  }, [query.data]);

  return query;
}

/**
 * Hook to query other users / group members metadata
 */
export function useOtherUsersQuery(conversationId, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.otherUsers(conversationId),
    queryFn: async () => {
      if (!conversationId) return { users: [], hasMore: false, nextCursor: null };
      const data = await getOtherUsers(conversationId, { limit: 30 });
      return {
        users: data.users || data.filtered || [],
        hasMore: Boolean(data.hasMore),
        nextCursor: data.nextCursor ?? null,
      };
    },
    enabled: Boolean(conversationId),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

/**
 * Hook to query user profile details
 */
export function useUserProfileQuery(userId, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.userProfile(userId),
    queryFn: async () => {
      if (!userId) return null;
      const resdata = await contactDetail(userId, { limit: 12 });
      return resdata;
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

/**
 * Hook to query explore feed
 */
export function useExploreFeedQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.exploreFeed,
    queryFn: async () => {
      const resdata = await postFeed({ limit: 10, ...params });
      return resdata;
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

/**
 * Hook to query predefined avatars list
 */
export function useAvatarsQuery(options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.avatars,
    queryFn: async () => {
      const resdata = await getAvatars({});
      return resdata.avatars || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    ...options,
  });
}
