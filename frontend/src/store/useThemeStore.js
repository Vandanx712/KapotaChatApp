import { create } from "zustand";

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem("kapota-theme");
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;

  const legacyTheme = localStorage.getItem("chat-theme");
  if (legacyTheme === "light" || legacyTheme === "dark") return legacyTheme;

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
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
    localStorage.setItem("kapota-theme", theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("kapota-theme", theme);
      return { theme };
    }),
}));
