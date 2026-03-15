import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("chat-theme") || "coffee",
  FILTERS:{
    Original: () => "none",
  
    Warm: (s) => `
      sepia(${s * 0.3}%)
      saturate(${100 + s}%)
      brightness(${100 + s * 0.2}%)
    `,
  
    Cool: (s) => `
      hue-rotate(${s * 1.5}deg)
      brightness(${100 - s * 0.1}%)
      contrast(${100 + s * 0.2}%)
    `,
  
    Vintage: (s) => `
      sepia(${s * 0.6}%)
      contrast(${100 - s * 0.3}%)
      brightness(${100 - s * 0.2}%)
    `,
  
    Mono: (s) => `
      grayscale(${s}%)
      contrast(${100 + s * 0.3}%)
    `,
  
    Noir: (s) => `
      grayscale(${s}%)
      contrast(${100 + s * 0.6}%)
      brightness(${100 - s * 0.4}%)
    `,
  
    Sunset: (s) => `
      sepia(${s * 0.5}%)
      saturate(${100 + s * 1.2}%)
      hue-rotate(${-s * 0.2}deg)
    `,
  
    Forest: (s) => `
      saturate(${100 + s * 1.2}%)
      hue-rotate(${s * 0.5}deg)
    `,
  
    Soft: (s) => `
      brightness(${100 + s * 0.3}%)
      contrast(${100 - s * 0.2}%)
    `,
  },
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },

  
}));
