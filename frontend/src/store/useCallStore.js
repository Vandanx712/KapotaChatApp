import { create } from "zustand";

export const useCallStore = create((set) => ({
  incomingCall: null,
  activeCall: null,

  setIncomingCall: (incomingCall) => set({ incomingCall }),

  clearIncomingCall: () => set({ incomingCall: null }),

  startOutgoingCall: (conversation) =>
    set((state) => {
      if (!conversation || state.activeCall) return state;
      return {
        activeCall: {
          mode: "outgoing",
          conversation,
          callId: "",
          callType: "video",
          phase: "preparing",
        },
        incomingCall: null,
      };
    }),

  acceptIncomingCall: () =>
    set((state) => {
      if (!state.incomingCall || state.activeCall) return state;
      return {
        activeCall: {
          mode: "incoming",
          conversation: state.incomingCall.conversation,
          callId: state.incomingCall.callId,
          callType: state.incomingCall.callType || "video",
          phase: "preparing",
        },
        incomingCall: null,
      };
    }),

  updateActiveCall: (updates) =>
    set((state) => ({
      activeCall: state.activeCall
        ? { ...state.activeCall, ...updates }
        : null,
    })),

  endCall: () => set({ activeCall: null, incomingCall: null }),
}));
