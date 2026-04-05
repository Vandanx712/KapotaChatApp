import { create } from "zustand";

export const useCallStore = create((set) => ({
  incomingCall: null,
  activeCall: null,

  setIncomingCall: (incomingCall) => set({ incomingCall }),

  clearIncomingCall: () =>
    set({
      incomingCall: null,
    }),

  startOutgoingCall: (conversation) =>
    set({
      activeCall: {
        mode: "outgoing",
        conversation,
        incomingSignal: null,
      },
      incomingCall: null,
    }),

  acceptIncomingCall: (conversationOverride = null) =>
    set((state) => {
      if (!state.incomingCall) return state;
      return {
        activeCall: {
          mode: "incoming",
          conversation: conversationOverride || state.incomingCall.conversation,
          incomingSignal: {
            from: state.incomingCall.from,
            offer: state.incomingCall.offer,
          },
        },
        incomingCall: null,
      };
    }),

  endCall: () =>
    set({
      activeCall: null,
      incomingCall: null,
    }),
}));
