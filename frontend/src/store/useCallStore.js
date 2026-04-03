import { create } from "zustand";

export const useCallStore = create((set) => ({
  incomingCall: null,
  callAccepted: false,
  callEnded: false,

  setIncomingCall: (data) => set({ incomingCall: data }),

  acceptCall: () =>
    set({
      callAccepted: true,
    }),

  endCall: () =>
    set({
      callEnded: true,
      callAccepted: false,
      incomingCall: null,
    }),
}));
