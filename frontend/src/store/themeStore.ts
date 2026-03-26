import { create } from 'zustand';

type Theme = 'dark' | 'light' | 'neon';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>((set) => {
  const saved = localStorage.getItem('uimr-theme') as Theme | null;
  const initial = saved || 'dark';
  document.documentElement.setAttribute('data-theme', initial);
  
  return {
    theme: initial,
    setTheme: (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('uimr-theme', theme);
      set({ theme });
    },
  };
});
