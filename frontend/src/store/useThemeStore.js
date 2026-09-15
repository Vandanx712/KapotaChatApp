import { create } from "zustand";

const applyThemeDOM = (theme) => {
  try {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-kapota-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch {
    /* ignore theme application errors in non-browser environments */
  }
};

const getInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem("chat-theme") || localStorage.getItem("kapota-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      applyThemeDOM(savedTheme);
      return savedTheme;
    }
  } catch {
    /* ignore localStorage errors */
  }

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const initial = prefersDark ? "dark" : "dark"; // Default dark
  applyThemeDOM(initial);
  return initial;
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
    localStorage.setItem("chat-theme", theme);
    localStorage.setItem("kapota-theme", theme);
    applyThemeDOM(theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("chat-theme", theme);
      localStorage.setItem("kapota-theme", theme);
      applyThemeDOM(theme);
      return { theme };
    }),
}));
