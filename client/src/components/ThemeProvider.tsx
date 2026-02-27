import { createContext, useContext, useState, useCallback, useEffect } from "react";

interface ThemeContextType {
  currentTheme: string;
  setTheme: (name: string) => void;
  availableThemes: string[];
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: "default",
  setTheme: () => {},
  availableThemes: [],
});

export function useTheme() {
  return useContext(ThemeContext);
}

const THEME_VARS: Record<string, Record<string, string>> = {
  default: {
    "--background": "220 20% 3%", "--foreground": "210 40% 96%",
    "--primary": "191 97% 50%", "--card": "220 20% 5%",
    "--card-foreground": "210 40% 96%",
    "--secondary": "220 15% 12%", "--secondary-foreground": "210 40% 96%",
    "--accent": "220 15% 12%", "--accent-foreground": "210 40% 96%",
    "--border": "220 15% 14%", "--muted": "220 15% 12%",
    "--muted-foreground": "215 20% 55%", "--input": "220 15% 12%",
    "--ring": "191 97% 50%", "--sidebar": "220 20% 4%",
    "--sidebar-primary": "191 97% 50%", "--sidebar-ring": "191 97% 50%",
    "--chart-1": "191 97% 50%",
  },
  midnight: {
    "--background": "240 20% 2%", "--foreground": "220 30% 95%",
    "--primary": "260 80% 65%", "--card": "240 20% 4%",
    "--card-foreground": "220 30% 95%",
    "--secondary": "240 15% 10%", "--secondary-foreground": "220 30% 95%",
    "--accent": "260 60% 20%", "--accent-foreground": "220 30% 95%",
    "--border": "240 15% 12%", "--muted": "240 15% 10%",
    "--muted-foreground": "240 15% 50%", "--input": "240 15% 10%",
    "--ring": "260 80% 65%", "--sidebar": "240 20% 3%",
    "--sidebar-primary": "260 80% 65%", "--sidebar-ring": "260 80% 65%",
    "--chart-1": "260 80% 65%",
  },
  emerald: {
    "--background": "160 20% 3%", "--foreground": "150 30% 95%",
    "--primary": "150 80% 45%", "--card": "160 20% 5%",
    "--card-foreground": "150 30% 95%",
    "--secondary": "160 15% 10%", "--secondary-foreground": "150 30% 95%",
    "--accent": "150 40% 15%", "--accent-foreground": "150 30% 95%",
    "--border": "160 15% 12%", "--muted": "160 15% 10%",
    "--muted-foreground": "160 15% 50%", "--input": "160 15% 10%",
    "--ring": "150 80% 45%", "--sidebar": "160 20% 3%",
    "--sidebar-primary": "150 80% 45%", "--sidebar-ring": "150 80% 45%",
    "--chart-1": "150 80% 45%",
  },
  crimson: {
    "--background": "0 15% 3%", "--foreground": "0 10% 95%",
    "--primary": "0 80% 55%", "--card": "0 15% 5%",
    "--card-foreground": "0 10% 95%",
    "--secondary": "0 10% 10%", "--secondary-foreground": "0 10% 95%",
    "--accent": "0 40% 15%", "--accent-foreground": "0 10% 95%",
    "--border": "0 10% 14%", "--muted": "0 10% 10%",
    "--muted-foreground": "0 10% 50%", "--input": "0 10% 10%",
    "--ring": "0 80% 55%", "--sidebar": "0 15% 3%",
    "--sidebar-primary": "0 80% 55%", "--sidebar-ring": "0 80% 55%",
    "--chart-1": "0 80% 55%",
  },
  gold: {
    "--background": "40 20% 3%", "--foreground": "40 20% 95%",
    "--primary": "40 90% 55%", "--card": "40 15% 5%",
    "--card-foreground": "40 20% 95%",
    "--secondary": "40 10% 10%", "--secondary-foreground": "40 20% 95%",
    "--accent": "40 40% 15%", "--accent-foreground": "40 20% 95%",
    "--border": "40 10% 14%", "--muted": "40 10% 10%",
    "--muted-foreground": "40 15% 50%", "--input": "40 10% 10%",
    "--ring": "40 90% 55%", "--sidebar": "40 20% 3%",
    "--sidebar-primary": "40 90% 55%", "--sidebar-ring": "40 90% 55%",
    "--chart-1": "40 90% 55%",
  },
  ocean: {
    "--background": "210 25% 3%", "--foreground": "200 30% 95%",
    "--primary": "200 85% 55%", "--card": "210 20% 5%",
    "--card-foreground": "200 30% 95%",
    "--secondary": "210 15% 10%", "--secondary-foreground": "200 30% 95%",
    "--accent": "200 40% 15%", "--accent-foreground": "200 30% 95%",
    "--border": "210 15% 12%", "--muted": "210 15% 10%",
    "--muted-foreground": "210 15% 50%", "--input": "210 15% 10%",
    "--ring": "200 85% 55%", "--sidebar": "210 20% 3%",
    "--sidebar-primary": "200 85% 55%", "--sidebar-ring": "200 85% 55%",
    "--chart-1": "200 85% 55%",
  },
  rose: {
    "--background": "330 15% 3%", "--foreground": "330 15% 95%",
    "--primary": "330 75% 60%", "--card": "330 15% 5%",
    "--card-foreground": "330 15% 95%",
    "--secondary": "330 10% 10%", "--secondary-foreground": "330 15% 95%",
    "--accent": "330 40% 15%", "--accent-foreground": "330 15% 95%",
    "--border": "330 10% 14%", "--muted": "330 10% 10%",
    "--muted-foreground": "330 10% 50%", "--input": "330 10% 10%",
    "--ring": "330 75% 60%", "--sidebar": "330 15% 3%",
    "--sidebar-primary": "330 75% 60%", "--sidebar-ring": "330 75% 60%",
    "--chart-1": "330 75% 60%",
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("tessera-theme") || "default";
  });

  const applyTheme = useCallback((name: string) => {
    const vars = THEME_VARS[name] || THEME_VARS.default;
    const root = document.documentElement;
    for (const [prop, value] of Object.entries(vars)) {
      root.style.setProperty(prop, value);
    }
  }, []);

  const setTheme = useCallback((name: string) => {
    if (!THEME_VARS[name]) return;
    setCurrentTheme(name);
    localStorage.setItem("tessera-theme", name);
    applyTheme(name);
  }, [applyTheme]);

  useEffect(() => {
    applyTheme(currentTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, availableThemes: Object.keys(THEME_VARS) }}>
      {children}
    </ThemeContext.Provider>
  );
}
